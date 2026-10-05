type Prop = {
  text: string;
  onClick?: () => any;
};

const GeneralButton = ({ text, onClick }: Prop) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-full border border-yellow-300/80 bg-gradient-to-b from-yellow-200 via-yellow-300 to-yellow-400 px-6 py-2.5 text-xs md:text-sm font-bold text-amber-950 shadow-[inset_0_2px_0_rgba(255,255,255,0.75),0_10px_20px_-6px_rgba(250,204,21,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.75),0_14px_26px_-6px_rgba(250,204,21,0.65)] active:translate-y-0.5 active:shadow-[inset_0_2px_0_rgba(255,255,255,0.5),0_4px_10px_-4px_rgba(250,204,21,0.5)]"
    >
      {/* glossy highlight on the top half */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/60 to-transparent"
      />
      {/* light sweep on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full -skew-x-12 bg-white/40 transition-transform duration-700 group-hover:translate-x-[400%]"
      />
      <span className="relative">{text}</span>
    </button>
  );
};

export default GeneralButton;
