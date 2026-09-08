module.exports = {
  async execute(oldMember, newMember) {
    try {
      if (newMember.guild.id !== process.env.GUILD_ID) return;

      if (oldMember.pending === true && newMember.pending === false) {
        const role = newMember.guild.roles.cache.get(
          process.env.COMMUNITY_MEMBER_ROLE_ID
        );

        if (!role) {
          console.error("Community Member role not found.");
          return;
        }

        if (newMember.roles.cache.has(role.id)) return;

        await newMember.roles.add(role);

        console.log(
          `Added Community Member role to ${newMember.user.tag}`
        );
      }
    } catch (error) {
      console.error(
        "Failed to assign Community Member role:",
        error
      );
    }
  },
};
