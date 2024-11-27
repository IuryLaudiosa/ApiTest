// const db = require("../bd/database");
require("dotenv").config();
const User = require('../models/User');
const Investimento = require('../models/Investimento');
const jwt = require("jsonwebtoken");
const JWT_TOKEN = process.env.JWT_TOKEN;


const token = process.env.TOKEN;

const axios = require("axios"); 




exports.getUnico = async (req, res) => {
  let { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "O símbolo da ação é obrigatório" });
  }



  console.log(`Buscando ação com símbolo: ${symbol}`);
  console.log("Usuário autenticado:", req.user);

  try {
    const response = await axios.get(`https://brapi.dev/api/quote/${symbol}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data?.results?.length > 0) {
      const acao = response.data.results[0];
      return res.json({
        stock: acao.symbol,
        name: acao.shortName,
        close: acao.regularMarketPrice,
        change: acao.regularMarketChangePercent,
        logo: acao.logo,
      });
    } else {
      return res.status(404).json({ error: "Ação não encontrada." });
    }
  } catch (error) {
    console.error("Erro ao buscar ação:", error.message);
    return res.status(500).json({ error: "Erro ao buscar ação", details: error.message });
  }
};

exports.depositar = async (req, res) => {
  const { cpf, valor } = req.body;

  if (!cpf || !valor || valor <= 0) {
    return res.status(400).send({ message: "CPF e valor são obrigatórios, e o valor deve ser positivo" });
  }

  try {
    const user = await User.findOne({ where: { cpf } });
    if (!user) {
      return res.status(404).send({ message: "Usuário não encontrado" });
    }


    user.saldo += valor;
    await user.save();

    res.send({ message: "Depósito realizado com sucesso!", saldo: user.saldo });
  } catch (error) {
    res.status(500).send({ message: "Erro ao realizar depósito", error: error.message });
  }
};

exports.retirar = async (req, res) => {
  const { cpf, valor } = req.body;

  if (!cpf || !valor || valor <= 0) {
    return res.status(400).send({ message: "CPF e valor são obrigatórios, e o valor deve ser positivo" });
  }

  try {
    const user = await User.findOne({ where: { cpf } });
    if (!user) {
      return res.status(404).send({ message: "Usuário não encontrado" });
    }

    if (user.saldo < valor) {
      return res.status(400).send({ message: "Saldo insuficiente para a retirada" });
    }

    user.saldo -= valor;
    await user.save();

    res.send({ message: "Retirada realizada com sucesso!", saldo: user.saldo });
  } catch (error) {
    res.status(500).send({ message: "Erro ao realizar retirada", error: error.message });
  }
};


exports.retirarTudo = async (req, res) => {
  const { cpf } = req.body;

  if (!cpf) {
    return res.status(400).send({ message: "CPF é obrigatório" });
  }

  try {
    const user = await User.findOne({ where: { cpf } });
    if (!user) {
      return res.status(404).send({ message: "Usuário não encontrado" });
    }

    if (user.saldo <= 0) {
      return res.status(400).send({ message: "Sem saldo disponível para retirada" });
    }

    user.saldo = 0;
    await user.save();

    res.send({ message: "Todo o saldo foi retirado com sucesso!", saldo: user.saldo });
  } catch (error) {
    res.status(500).send({ message: "Erro ao realizar retirada", error: error.message });
  }
};

exports.getSaldo = async (req, res) => {
  const { cpf } = req.query;

  try {
    const user = await User.findOne({ where: { cpf } });
    if (!user) {
      return res.status(404).send({ message: "Usuário não encontrado" });
    }

    res.send({ saldo: user.saldo });
  } catch (error) {
    res.status(500).send({ message: "Erro ao buscar saldo", error: error.message });
  }
};

exports.comprarAcao = async (req, res) => {
  const { userCpf, stockName, price, quantity, type, symbol } = req.body;

  if (!userCpf || !stockName || !price || !quantity) {
    return res.status(400).send({ message: "Todos os campos são obrigatórios" });
  }

  try {
    const user = await User.findOne({ where: { cpf: userCpf } });
    if (!user) {
      return res.status(404).send({ message: "Usuário não encontrado" });
    }

    const totalCompra = price * quantity;

    if (user.saldo < totalCompra) {
      return res.status(400).send({ message: "Saldo insuficiente para realizar a compra" });
    }

    let investimentoExistente = await Investimento.findOne({ 
      where: { userCpf, stockName, type: "Compra" }
    });

    if (investimentoExistente) {
      investimentoExistente.quantity += quantity;
      investimentoExistente.price += (quantity * price)
      await investimentoExistente.save();

    } else {
      investimentoExistente = await Investimento.create({
        userCpf,
        type,
        stockName,
        price,
        quantity,
        symbol,
        purchaseDate: new Date(),
      });
    }

    user.saldo -= totalCompra;
    await user.save();

    res.status(201).send({ message: "Ação comprada com sucesso!", investimento: investimentoExistente, saldoAtualizado: user.saldo });
  } catch (error) {
    res.status(500).send({ message: "Erro ao registrar compra de ação", error: error.message });
  }
};

exports.listarInvestimentos = async (req, res) => {
  const { cpf } = req.query;
  
  console.log("CPF recebido na requisição:", cpf); 
  
  if (!cpf) {
    return res.status(400).send({ message: "CPF é obrigatório" });
  }

  try {
    const investimentos = await Investimento.findAll({ where: { userCpf: cpf } });
    console.log("Investimentos encontrados:", investimentos); 
    res.status(200).json(investimentos);
  } catch (error) {
    res.status(500).send({ message: "Erro ao listar investimentos", error: error.message });
  }
};

exports.jogarAviaozinho = async (req, res) => {
  const { cpf, apostaInicial, acao } = req.body;

  if (!cpf || !apostaInicial || apostaInicial <= 0) {
    return res.status(400).send({ message: "CPF e valor de aposta são obrigatórios, e o valor deve ser positivo" });
  }

  try {
    const user = await User.findOne({ where: { cpf } });
    if (!user) {
      return res.status(404).send({ message: "Usuário não encontrado" });
    }

    if (user.saldo <= 0 || user.saldo < apostaInicial) {
      return res.status(400).send({ message: "Saldo insuficiente para realizar a aposta" });
    }

    let multiplicador = 1;
    const probabilidadeCrash = 0.1;
    let crashed = false;
    let ganhoFinal = 0;

    while (!crashed) {
      multiplicador += Math.random(); 
      if (Math.random() < probabilidadeCrash) {
        crashed = true;
      }

      
      ganhoFinal = apostaInicial * multiplicador;

      if (acao === 'parar' && !crashed) {
        ganhoFinal = parseFloat(ganhoFinal.toFixed(2)); 
        user.saldo += ganhoFinal; 
        await user.save();
        console.log("Saldo após ganho:", user.saldo);
        return res.status(200).send({
          message: "Você ganhou!",
          ganho: ganhoFinal.toFixed(2),
          multiplicador: multiplicador.toFixed(2),
          saldoAtualizado: user.saldo,
        });
      }
    }
    user.saldo -= apostaInicial;
    await user.save();
    console.log("Saldo após perda (crash):", user.saldo);
    return res.status(200).send({
      message: "Você perdeu a aposta!",
      multiplicador: multiplicador.toFixed(2),
      saldoAtualizado: user.saldo,
    });

  } catch (error) {
    res.status(500).send({ message: "Erro ao realizar a aposta", error: error.message });
  }
};

exports.venderAcao = async (req, res) => {
  const { userCpf, symbol, price, quantity } = req.body;

  if (!userCpf || !symbol || !quantity || quantity <= 0) {
    return res.status(400).send({ message: "Todos os campos são obrigatórios e a quantidade deve ser positiva" });
  }

  try {
    const investimentoCompra = await Investimento.findOne({
      where: { userCpf, symbol, type: "Compra" },
    });

    if (!investimentoCompra) {
      return res.status(404).send({ message: "Investimento não encontrado para este símbolo e usuário" });
    }

    if (investimentoCompra.quantity < quantity) {
      return res.status(400).send({ message: "Quantidade insuficiente para venda" });
    }

    const valorVenda = parseFloat((quantity * price).toFixed(2)); // Formatar valor de venda

    // Cria registro de venda
    const venda = await Investimento.create({
      userCpf,
      stockName: investimentoCompra.stockName,
      symbol,
      type: "Venda",
      price,
      quantity,
      purchaseDate: new Date(),
    });

    if (!venda) {
      throw new Error("Erro ao registrar a venda no banco de dados");
    }

    // Atualiza quantidade restante no investimento de compra
    investimentoCompra.quantity -= quantity;
    await investimentoCompra.save();

    const user = await User.findOne({ where: { cpf: userCpf } });
    if (!user) {
      return res.status(404).send({ message: "Usuário não encontrado" });
    }

    // Atualiza saldo do usuário
    user.saldo += valorVenda;
    await user.save();

    console.log("Venda registrada com sucesso:", venda);
    console.log("Saldo atualizado do usuário:", user.saldo);

    return res.status(201).send({
      message: "Venda registrada com sucesso!",
      saldoAtualizado: parseFloat(user.saldo.toFixed(2)),
    });
  } catch (error) {
    console.error("Erro ao registrar venda de ação:", error.message);
    return res.status(500).send({ message: "Erro ao registrar venda de ação", error: error.message });
  }
};