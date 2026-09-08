const MissionVission = () => {
  return (
    <main className="flex flex-col items-center justify-center mt-20 mb-8 mx-auto w-11/12 md:w-8/12 lg:w-1/2">
      <h1 className="text-2xl font-bold text-secondary-blue">
        Why Join Uprix?
      </h1>
      <p className="text-center">
        Success doesn't happen by chance. It is built with the right mindset,
        practical skills, and consistent action. When you join Uprix, you are
        not just joining a group—you are stepping into a supportive space that
        gives you:
        <br />
        <span className="font-semibold mt-1 text-secondary-blue">
          The right circle → Real Growth → Accountablity
        </span>
      </p>
      <div className="w-full mt-8 flex items-center gap-2">
        <div className="bg-slate-200 max-h-48 w-1/2 rounded-lg p-4 text-md">
          <h6 className="font-bold text-secondary-blue">Vision</h6>
          <p className="text-sm">
            To build a community of Uprizers who refuse medicrocity, support
            each other and evolve upward, bcomin the best version of themselves
            day by day.
          </p>
        </div>
        <div className="bg-slate-200 max-h-48 rounded-lg p-4 w-1/2 text-md">
          <h6 className="font-bold text-secondary-blue">Mission</h6>
          <p className="text-sm">
            To guide Uprizers to Xcel in life, take bold actions and grow every
            day, turning small consistent steps into real impact and Xcellence.
          </p>
        </div>
      </div>
    </main>
  );
};

export default MissionVission;
