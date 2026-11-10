export default function Beams({
  beamWidth = 3,
  beamHeight = 30,
  beamNumber = 20,
  lightColor = '#ffffff',
  speed = 2,
  noiseIntensity = 1.75,
  scale = 0.2,
  rotation = 30,
}) {
  return (
    <div
      className="beams-field"
      style={{
        '--beam-width': `${beamWidth}px`,
        '--beam-height': `${beamHeight}vh`,
        '--beam-color': lightColor,
        '--beam-speed': `${Math.max(speed, 0.5)}s`,
        '--beam-scale': scale,
        '--beam-rotation': `${rotation}deg`,
        '--beam-noise': noiseIntensity,
      }}
    >
      {Array.from({ length: beamNumber }).map((_, index) => (
        <span
          key={index}
          className="beam"
          style={{
            left: `${(index / Math.max(beamNumber - 1, 1)) * 100}%`,
            animationDelay: `${(index % 6) * -0.45}s`,
            animationDuration: `${Math.max(speed, 0.5) + (index % 5) * 0.7}s`,
            opacity: 0.25 + ((index % 7) * 0.08),
          }}
        />
      ))}
    </div>
  );
}
