import Navbar from "@/components/mainPage/Navbar";
import Hero from "@/components/mainPage/Hero";
import UprizerSlider from "@/components/mainPage/UprizerSlider";
import MissionVission from "@/components/mainPage/MissionVission";
import Testimonials from "@/components/mainPage/Testimonials";
import Activities from "@/components/mainPage/Activities";
import Footer from "@/components/mainPage/Footer";

const Home = () => {
  return (
    <main className="relative w-full overflow-x-hidden overflow-y-visible bg-transparent">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_30%)]" />

      <Navbar />
      <Hero />
      <UprizerSlider />
      <MissionVission />
      <Activities />
      <Testimonials />
      <Footer />
    </main>
  );
};

export default Home;
