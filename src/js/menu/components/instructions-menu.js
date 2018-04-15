import { h } from "preact";

import WasdSvg from "../../../images/wasd.svg";
import MouseSvg from "../../../images/mouse.svg";
import SpaceSvg from "../../../images/space.svg";
import WeaponPickup from "../../../images/weapon-pickup.png";
import EnergyPickup from "../../../images/energy-pickup.png";

export default function InstructionsMenu({ gameStore, onBack }) {
  return (
    <div id="instructions-menu" class="menu">
      <div class="menu-title">Instructions</div>
      <div class="instruction-wrap">
        <WasdSvg width="150px" />
        <span class="label">W A S D to move!</span>
      </div>
      <div class="instruction-wrap mouse">
        <MouseSvg width="100px" />
        <span class="label">LEFT CLICK to shoot!</span>
      </div>
      <div class="instruction-wrap">
        <SpaceSvg width="150px" />
        <span class="label">SPACE to dash!</span>
      </div>
      <div class="instruction-wrap pickup">
        <div class="img-wrap">
          <img src={WeaponPickup} />
        </div>
        <span class="label"> to pickup a new weapon.</span>
      </div>
      <div class="instruction-wrap pickup">
        <div class="img-wrap">
          <img src={EnergyPickup} />
        </div>
        <span class="label"> to pickup health.</span>
      </div>
      <button onClick={onBack}>Back</button>
    </div>
  );
}
