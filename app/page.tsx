import Navbar from "@/components/mainPage/Navbar";
import Hero from "@/components/mainPage/Hero";
import UprizerSlider from "@/components/mainPage/UprizerSlider";
import MissionVission from "@/components/mainPage/MissionVission";
import Testimonials from "@/components/mainPage/Testimonials";
import Activities from "@/components/mainPage/Activities";

const Home = () => {
  return (
    <main
      className="relative w-full overflow-x-hidden overflow-y-visible bg-white"
      style={{
        backgroundImage:
          "radial-gradient(circle at top, rgba(96,165,250,0.12), transparent 26%), linear-gradient(rgba(15, 23, 42, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.045) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 64px 64px, 64px 64px",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_30%)]" />

      <Navbar />
      <Hero />
      <UprizerSlider />
      <MissionVission />
      <Activities />
      <Testimonials />
    </main>
  );
};

export default Home;
