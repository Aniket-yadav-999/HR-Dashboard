export function getEmployeeStats(users) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const newJoiners = users.filter((user) => {
    const joinedAt = new Date(user.joinedAt);
    return joinedAt.getMonth() === currentMonth && joinedAt.getFullYear() === currentYear;
  });

  const exits = users.filter((user) => user.status === "exited");

  return {
    total: users.length,
    active: users.filter((user) => user.status === "active").length,
    inactive: users.filter((user) => user.status === "inactive").length,
    newJoiners: newJoiners.length,
    exits: exits.length
  };
}

export function formatDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(date));
}
