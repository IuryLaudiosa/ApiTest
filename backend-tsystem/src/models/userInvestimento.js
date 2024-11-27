const User = require('./User');
const Investimento = require('./Investimento');

User.hasMany(Investimento, { foreignKey: 'userCpf', sourceKey: 'cpf', as: 'investimentos' });
Investimento.belongsTo(User, { foreignKey: 'userCpf', targetKey: 'cpf', as: 'user' });
