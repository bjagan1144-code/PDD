export const defaultNotifications = [
  {
    id: "notif-1",
    title: "Simulation Completed",
    message: "Simulation #sim-101 for Ibuprofen + Chitosan completed successfully with score 87/100.",
    time: "10 mins ago",
    read: false,
    type: "success"
  },
  {
    id: "notif-2",
    title: "AI Model Recalibration",
    message: "Random Forest Regression model updated with new synthetic validation parameters.",
    time: "2 hours ago",
    read: false,
    type: "info"
  },
  {
    id: "notif-3",
    title: "High Risk Release Alert",
    message: "Simulation #sim-103 detected underdose release kinetics using PLA polymer matrix.",
    time: "1 day ago",
    read: true,
    type: "warning"
  },
  {
    id: "notif-4",
    title: "Report Generated",
    message: "Sustained oral delivery validation report for Metformin + Alginate has been generated.",
    time: "2 days ago",
    read: true,
    type: "success"
  }
];
