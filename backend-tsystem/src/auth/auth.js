const jwt = require("jsonwebtoken");
const JWT_TOKEN = process.env.JWT_TOKEN;

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.error("Token ausente no header Authorization");
    return res.status(401).json({ error: "Acesso negado. Token não fornecido." });
  }

  const token = authHeader.split(" ")[1];
  console.log("Token recebido:", token);

  if (!token) {
    console.error("Token não encontrado após 'Bearer'");
    return res.status(401).json({ error: "Acesso negado. Token inválido." });
  }

  try {
    const decoded = jwt.verify(token, JWT_TOKEN); 
    req.user = decoded; 
    console.log("Token decodificado:", decoded);
    next();
  } catch (error) {
    console.error("Erro na validação do token:", error.message);
    res.status(400).json({ error: "Token inválido ou expirado" });
  }
}

module.exports = { authenticateToken };