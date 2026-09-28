// Sutton–Graves cold-wall stagnation correlation, SI: W/m².
// Mars k from NASA NTRS 20060004824, Eq. 1. Engineering estimate, not ablation/CFD.
export function heatFlux(density, airspeed, noseRadius = 2.7) {
  return 1.9027e-4 * Math.sqrt(Math.max(0,density)/noseRadius) * Math.max(0,airspeed)**3;
}
export function thermalStep(temperature, flux, dt) {
  // Lumped surface layer: emissivity .85, areal heat capacity 1200 J/(m² K).
  const ambient=210, radiation=.85*5.670374419e-8*(temperature**4-ambient**4);
  return Math.max(ambient,temperature+(flux-radiation)*dt/1200);
}
