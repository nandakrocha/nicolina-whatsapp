export default function DownloadBackupTest() {
  console.log("🟢 TESTE: Componente carregado!");
  
  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      background: "linear-gradient(to bottom right, #084d6e, #0a5f88)",
      color: "white",
      fontSize: "24px",
      fontWeight: "bold"
    }}>
      <div style={{
        background: "white",
        color: "#084d6e",
        padding: "40px",
        borderRadius: "12px",
        textAlign: "center"
      }}>
        <h1>✅ PÁGINA FUNCIONANDO!</h1>
        <p style={{ fontSize: "16px", marginTop: "20px" }}>
          Componente de teste carregado com sucesso
        </p>
      </div>
    </div>
  );
}
