import { h } from "preact";

import WasdSvg from "../../../images/wasd.svg";
import MouseSvg from "../../../images/mouse.svg";
import SpaceSvg from "../../../images/space.svg";
import WeaponPickup from "../../../images/weapon-pickup.png";
import EnergyPickup from "../../../images/energy-pickup.png";

export default function InstructionsMenu({ gameStore, onBack }) {
  return (
    <div id="pause-menu" class="menu">
      <div class="menu-title">Instructions</div>
      <div>
        <WasdSvg width="150px" />
        <span> - to move!</span>
      </div>
      <div>
        <MouseSvg width="100px" />
        <span> - to shoot!</span>
      </div>
      <div>
        <SpaceSvg width="150px" />
        <span> - to dash!</span>
      </div>
      <div>
        <img src={WeaponPickup} />
        <span> - to pickup a new weapon.</span>
      </div>
      <div>
        <img src={EnergyPickup} />
        <span> - to pickup health.</span>
      </div>
      <div>Good luck!</div>
      <button onClick={onBack}>Back</button>
    </div>
  );
}
