from alembic import context
from flamelab.storage.models import Base

connection = context.config.attributes.get("connection")
if connection is None:
    raise RuntimeError("Use flamelab.storage.database.migrate(Settings())")
context.configure(connection=connection, target_metadata=Base.metadata)
with context.begin_transaction():
    context.run_migrations()
