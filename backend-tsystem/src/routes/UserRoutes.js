const express = require("express");
const { authenticateToken } = require("../auth/auth");
const rotasAbertas = require("../controller/rotasAbertas");
const User = require("../controller/UserController");
const router = express.Router();

// Rotas Abertas
router.post("/registro", rotasAbertas.register);
router.post("/login", rotasAbertas.login);
router.get("/github", rotasAbertas.getOAuth()); // Note o parêntese para chamar a função
router.get("/github/callback", rotasAbertas.getOAuthCallBack());



// Rotas Fechadas
router.get("/quote/list", rotasAbertas.get);
router.get("/quote/unico", authenticateToken, User.getUnico);
router.post("/depositar", authenticateToken, User.depositar);
router.get("/saldo", authenticateToken, User.getSaldo);
router.post("/comprar", authenticateToken, User.comprarAcao);
router.post("/vender", authenticateToken, User.venderAcao);
router.post("/retirar", authenticateToken, User.retirar);
router.post("/retirarTudo", authenticateToken, User.retirarTudo);
router.get("/investimentos", authenticateToken, User.listarInvestimentos);
router.post("/jogarAviaozinho", authenticateToken, User.jogarAviaozinho);

module.exports = router;


  