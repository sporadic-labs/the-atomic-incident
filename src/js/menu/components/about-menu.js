import { h } from "preact";

import Logo from "../../../images/sporadicLabs-logo-color-64.png";
import Github from "../../../images/GitHub-Mark-Light-32px.png";
import Website from "../../../images/sporadicLabs-logo-white-32.png";

export default function AboutMenu({ gameStore, onBack }) {
  return (
    <div id="about-menu" class="menu">
      <div class="menu-title">About</div>
      <div class="brand">
        <div class="created-by">Created by</div>
        <div class="logo-wrap">
          <img src={Logo} />
          <span class="logo-text">Sporadic Labs</span>
        </div>
      </div>
      <div id="credits-wrap">
        <div id="credits-title">Sporadic Labs is:</div>
        <a
          href="https://github.com/mikewesthad"
          alt="Github"
          target="_blank"
          rel="noopener noreferrer"
        >
          Mike Hadley
        </a>
        <a href="https://github.com/retwedt" alt="Github" target="_blank" rel="noopener noreferrer">
          Rex Twedt
        </a>
      </div>
      <div class="links">
        <a
          href="https://github.com/sporadic-labs/the-atomic-incident"
          alt="Github"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={Github} />
        </a>
        <a
          href="https://sporadic-labs.github.io/"
          alt="Website"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={Website} />
        </a>
      </div>
      <button onClick={onBack}>Back</button>
    </div>
  );
}
