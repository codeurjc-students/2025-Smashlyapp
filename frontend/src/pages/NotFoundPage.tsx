export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <h1>404 - Página no encontrada</h1>
      <p>La página que buscas no existe.</p>
      <a href="/" style={{ color: "#16a34a", textDecoration: "none" }}>
        ← Volver al inicio
      </a>
    </div>
  );
}