require("dotenv").config();
const User = require('../models/User');
const Investimento = require('../models/Investimento');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const TOKEN = process.env.TOKEN;
const JWT_TOKENN = process.env.JWT_TOKEN;
const axios = require("axios"); 
const passport = require('../config/passportconfig');

exports.register = async (req, res) => {
    if (!req.body.name || !req.body.email || !req.body.password || !req.body.cpf) {
      return res.status(400).send({ message: "Todos os campos são obrigatórios" });
    }
  
    try {
  
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        saldo: 0,
        cpf: req.body.cpf
      });
  
      res.status(201).send({ message: "Usuário registrado com sucesso!", user });
    } catch (error) {
      res.status(500).send({ message: "Erro ao registrar usuário", error: error.message });
    }
  };
  
  exports.login = async (req, res) => {
    const { cpf, password } = req.body;
  
    if (!cpf || !password) {
      return res.status(400).json({ error: "CPF e senha são obrigatórios" });
    }
  
    console.log("AuthController: " + "CPF: " + cpf, "Senha: " + password);
  
    try {
      const user = await User.findOne({ where: { cpf } });
  
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
  
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }
  
      const token = jwt.sign(
        { id: user.id, name: user.name, cpf: user.cpf },
        process.env.JWT_TOKEN, // Use o JWT_TOKEN correto
        { expiresIn: "1h" }
      );
  
      res.json({
        id: user.id,
        name: user.name,
        token: token,
        cpf: user.cpf,
        saldo: user.saldo,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  exports.get = async (req, res) => {
    try {
        const response = await axios.get(`https://brapi.dev/api/quote/list?token=${TOKEN}`);
        const resumoAcoes = response.data.stocks.map((data) => ({
            stock: data.stock, 
            name: data.name,
            logo: data.logo,
            type: data.type,
            close: data.close,
            change: data.change,
        }));
        console.log(resumoAcoes[1])
        res.json(resumoAcoes);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar dados das ações", details: error.message });
    }
};

exports.getOAuth = () => passport.authenticate('github', { scope: ['user:email'] });

exports.getOAuthCallBack = () => [
  passport.authenticate('github', { failureRedirect: '/' }),
  async (req, res) => {
    try {
      const token = jwt.sign({ id: req.user.id }, process.env.JWT_TOKENN, { expiresIn: '1h' });

      res.json({
        message: 'Login via GitHub realizado com sucesso!',
        token,
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
        },
      });
    } catch (error) {
      console.error('Erro ao gerar token após login GitHub:', error);
      res.status(500).send('Erro ao completar login.');
    }
  },
];