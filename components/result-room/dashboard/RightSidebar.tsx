import SessionReminders from "./SessionReminders";

const RightSidebar = () => {
  return (
    <main>
      <SessionReminders urgentMinutes={30} graceSeconds={60} maxVisible={4} />
    </main>
  );
};

export default RightSidebar;
