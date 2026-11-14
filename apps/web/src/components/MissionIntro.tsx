import FlameIllustration from "./FlameIllustration";
import { Mark } from "./ui";
import flamePhoto from "../assets/iss-flame.jpg";
import flexPoster from "../assets/flex-iss-frame.jpg";
import "../mission-intro.css";

const flexSource = "https://svs.gsfc.nasa.gov/11318/";
const flexClip = "https://svs.gsfc.nasa.gov/vis/a010000/a011300/a011318/ISS_FlexFlame-540-MASTER_high.mp4";

export function MissionIntro({ onEnter }: { onEnter: () => void }) {
  return <main className="mission-intro" id="intro-main" tabIndex={-1}>
    <section className="mission-intro-hero" aria-labelledby="mission-intro-title">
      <header className="mission-intro-masthead">
        <span><Mark /> FlameLab SI</span>
        <a href="https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/" target="_blank" rel="noreferrer">NASA Space Apps 2026 ↗</a>
      </header>
      <div className="mission-intro-copy">
        <h1 id="mission-intro-title">Flame in <em>Freefall.</em></h1>
        <p>Imagine a flame in a spacecraft. Hot gases barely rise, and ventilation changes how oxygen reaches the fire. What can decades of experiments tell a crew about the conditions they face?</p>
        <div className="mission-intro-actions">
          <button type="button" onClick={onEnter}>Open dashboard <span aria-hidden="true">→</span></button>
          <a href="#fire-in-orbit">See a flame in orbit <span aria-hidden="true">↓</span></a>
        </div>
      </div>
      <figure className="mission-intro-visual">
        <div className="mission-intro-plate">
          <img src={flamePhoto} width="1041" height="952" alt="Glowing orange soot clusters inside a rounded flame on the International Space Station" fetchPriority="high" />
        </div>
        <figcaption>
          <span>Soot clusters in a flame aboard the ISS</span>
          <a href="https://www.nasa.gov/image-article/studying-flames-microgravity/" target="_blank" rel="noreferrer">NASA · Flame Design ↗</a>
        </figcaption>
      </figure>
    </section>

    <section className="mission-intro-orbit" id="fire-in-orbit" aria-labelledby="fire-in-orbit-title">
      <div className="mission-intro-orbit-copy">
        <h2 id="fire-in-orbit-title">A flame in orbit.</h2>
        <p>Hot gas rises on Earth, stretching a candle flame into a teardrop. In microgravity, buoyancy is weaker. The flame can become rounder, and ventilation changes how fresh oxygen reaches it.</p>
      </div>
      <div className="mission-intro-comparison">
        <figure className="mission-intro-footage">
          <p className="cap flame-title">Experiment footage</p>
          <a className="mission-intro-clip" href={flexClip} target="_blank" rel="noreferrer">
            <img src={flexPoster} width="1024" height="576" alt="" loading="lazy" />
            <span><span aria-hidden="true">▶</span> Watch FLEX footage</span>
          </a>
          <figcaption>
            <span>FLEX · International Space Station</span>
            <a href={flexSource} target="_blank" rel="noreferrer">NASA SVS <span aria-hidden="true">↗</span></a>
          </figcaption>
        </figure>
        <FlameIllustration gravityLabel="microgravity" o2={21} flow={0} />
      </div>
    </section>
    <section className="mission-intro-orbit" aria-labelledby="mission-story-title">
      <div className="mission-intro-orbit-copy">
        <h2 id="mission-story-title">From experiment to evidence.</h2>
        <div>
          <p>NASA’s archive spans solid fuels, smoke detection and flame suppression. Each campaign records different materials, conditions and measurements.</p>
          <p>FlameLab brings those records into one workspace. Find a study, compare the measurements it actually reports, and open the source behind each point.</p>
        </div>
      </div>
    </section>
    <footer className="mission-intro-footer">
      <span>FlameLab SI / Los TTS</span>
      <button type="button" onClick={onEnter}>Explore the research <span aria-hidden="true">→</span></button>
    </footer>
  </main>;
}
