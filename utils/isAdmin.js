module.exports = async function isAdmin(interaction) {
  if (!interaction.inGuild()) return false;

  const member = await interaction.guild.members.fetch(
    interaction.user.id
  );

  return member.roles.cache.has(process.env.ADMIN_ROLE_ID);
};
