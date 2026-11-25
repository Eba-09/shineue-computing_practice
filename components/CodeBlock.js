export default function CodeBlock({ code }) {
  return (
    <pre className="code">
      {code.split('\n').map((l, i) => (
        <div key={i}>
          <span className="ln">{i + 1}</span>
          {l}
        </div>
      ))}
    </pre>
  );
}
