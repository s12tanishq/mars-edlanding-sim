export const number = (value, digits = 0) =>
  Number.isFinite(value)
    ? value.toLocaleString("en-US", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      })
    : "—";
export function missionTime(seconds) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}
export const phaseLabels = {
  aerobraking: "Aero-braking",
  parachute: "Parachute descent",
  poweredDescent: "Powered descent",
  landed: "Surface contact",
  crashed: "Hard impact",
};
