export const convertTo24Hour = (time) => {
  if (!time) return null;

  // If already 24-hour (e.g. "05:00" or "22:30")
  if (
    !time.toUpperCase().includes("AM") &&
    !time.toUpperCase().includes("PM")
  ) {
    return time;
  }

  const [timePart, modifier] = time.trim().split(" ");
  let [hours, minutes = "00"] = timePart.split(":");

  hours = parseInt(hours, 10);

  if (modifier.toUpperCase() === "PM" && hours !== 12) {
    hours += 12;
  }

  if (modifier.toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes}`;
};
