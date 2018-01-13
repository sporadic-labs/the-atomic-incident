export default {
  SCATTERSHOT: "SCATTERSHOT",
  RAPID_FIRE: "RAPID_FIRE",
  PIERCING_SHOT: "PIERCING_SHOT",
  HOMING_SHOT: "HOMING_SHOT",
  ROCKET_LAUNCHER: "ROCKET_LAUNCHER",
  FLAMETHROWER: "FLAMETHROWER"
};

export function getFormattedType(type) {
  return type
    .toLowerCase()
    .split("_")
    .map(word => word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase())
    .join(" ");
}
