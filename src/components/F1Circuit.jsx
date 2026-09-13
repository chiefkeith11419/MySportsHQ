export default function F1Circuit({
  circuit,
}) {
  if (!circuit) {
    return (
      <div className="f1-circuit-missing">
        <span>TRACK</span>

        <strong>
          Circuit data unavailable
        </strong>
      </div>
    );
  }


  if (!circuit.svg) {
    return (
      <div className="f1-circuit-missing">
        <span>TRACK</span>

        <strong>
          {circuit.name}
        </strong>

        <small>
          Track SVG unavailable
        </small>
      </div>
    );
  }


  return (
    <div className="f1-circuit">

      <img
        src={circuit.svg}
        alt={`${circuit.name} circuit layout`}
      />

      <div className="f1-circuit__caption">

        <strong>
          {circuit.name}
        </strong>

        <span>
          {circuit.country}
        </span>

      </div>

    </div>
  );
}