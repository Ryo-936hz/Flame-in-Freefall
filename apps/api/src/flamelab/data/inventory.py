"""Bounded ZIP inventory with member hashes; no extraction and no content execution."""

import hashlib
import io
import stat
import zipfile
from collections import Counter
from dataclasses import dataclass
from pathlib import Path, PurePosixPath


class UnsafeArchive(ValueError):
    """An archive violates the local inspection limits."""


@dataclass(frozen=True)
class InventoryLimits:
    max_archive_bytes: int = 512 * 1024 * 1024
    max_member_bytes: int = 128 * 1024 * 1024
    max_total_bytes: int = 512 * 1024 * 1024
    max_members: int = 10000
    max_ratio: float = 100.0
    max_nested_depth: int = 2


def _safe_name(name: str) -> str:
    normalized = name.replace("\\", "/")
    parts = PurePosixPath(normalized)
    if (not name or "\x00" in name or ":" in name or parts.is_absolute()
            or ".." in parts.parts):
        raise UnsafeArchive("unsafe archive member path")
    # Reject Windows device names, trailing dots/spaces and normalized aliases too.
    reserved = {"CON", "PRN", "AUX", "NUL"} | {
        f"{kind}{n}" for kind in ("COM", "LPT") for n in range(1, 10)
    }
    for part in normalized.rstrip("/").split("/"):
        if (not part or part in (".", "..") or part.rstrip(" .") != part
                or part.split(".")[0].upper() in reserved):
            raise UnsafeArchive("unsafe Windows archive member path")
    return normalized.casefold().rstrip("/")


def inventory_zip(path: str | Path, limits: InventoryLimits | None = None) -> dict:
    """Validate all headers first, then stream/hash members including nested ZIPs.

    Budgets count nested content again because decompression also consumes resources.
    Binary documents are only hashed. No external links, macros or programs are opened.
    """
    limits = limits or InventoryLimits()
    archive = Path(path)
    if archive.stat().st_size > limits.max_archive_bytes:
        raise UnsafeArchive("archive exceeds compressed-size limit")
    budget = {"bytes": 0, "members": 0}

    def scan(source, depth: int) -> list[dict]:
        with zipfile.ZipFile(source) as opened:
            infos = opened.infolist()
            budget["members"] += len(infos)
            if budget["members"] > limits.max_members:
                raise UnsafeArchive("archive exceeds member-count limit")
            names = set()
            for info in infos:
                name = _safe_name(info.filename)
                if name in names:
                    raise UnsafeArchive("duplicate or aliased archive path")
                names.add(name)
                if stat.S_ISLNK(info.external_attr >> 16):
                    raise UnsafeArchive("archive symbolic links are forbidden")
                if info.flag_bits & 1:
                    raise UnsafeArchive("encrypted archive members are unsupported")
                if info.file_size > limits.max_member_bytes:
                    raise UnsafeArchive("archive member exceeds size limit")
                if info.file_size / max(1, info.compress_size) > limits.max_ratio:
                    raise UnsafeArchive("archive member exceeds expansion ratio")
                budget["bytes"] += info.file_size
            if budget["bytes"] > limits.max_total_bytes:
                raise UnsafeArchive("archive exceeds expanded-size limit")
            members = []
            for info in infos:
                record = {
                    "path": info.filename, "bytes": info.file_size,
                    "compressed_bytes": info.compress_size, "directory": info.is_dir(),
                }
                if not info.is_dir():
                    nested = PurePosixPath(info.filename).suffix.lower() == ".zip"
                    if nested and depth >= limits.max_nested_depth:
                        raise UnsafeArchive("nested archive depth exceeded")
                    digest = hashlib.sha256()
                    content = io.BytesIO() if nested else None
                    count = 0
                    with opened.open(info) as stream:
                        while chunk := stream.read(1024 * 1024):
                            count += len(chunk)
                            if count > info.file_size or count > limits.max_member_bytes:
                                raise UnsafeArchive("member size differs from archive header")
                            digest.update(chunk)
                            if content is not None:
                                content.write(chunk)
                    if count != info.file_size:
                        raise UnsafeArchive("incomplete archive member")
                    record["sha256"] = digest.hexdigest()
                    if content is not None:
                        content.seek(0)
                        record["members"] = scan(content, depth + 1)
                members.append(record)
            return members

    with archive.open("rb") as stream:
        digest = hashlib.file_digest(stream, "sha256").hexdigest()
        stream.seek(0)
        members = scan(stream, 0)
    return {
        "archive": archive.name, "bytes": archive.stat().st_size, "sha256": digest,
        "members": members, "files": sum(not item["directory"] for item in members),
        "directories": sum(item["directory"] for item in members),
        "counts": dict(Counter(PurePosixPath(item["path"]).suffix.lower()
                               for item in members if not item["directory"])),
        "uncompressed_bytes": sum(item["bytes"] for item in members),
        "nested_inclusive_members": budget["members"],
        "nested_inclusive_bytes": budget["bytes"],
        "license_status": "pending_review", "extracted": False,
    }
