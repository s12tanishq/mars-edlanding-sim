import { Simulation } from "../src/shared/Simulation.js";
const scenario = process.argv[2] || "nominal";
const sim = new Simulation(scenario);
while (!sim.complete) sim.step();
console.log(
  JSON.stringify(
    {
      scenario,
      time: sim.time,
      events: sim.events,
      result: sim.result,
      final: sim.state,
    },
    null,
    2,
  ),
);
