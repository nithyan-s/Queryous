const animations = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes typing {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.5; }
  }

  @keyframes loading-bar {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.4; }
    50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
  }

  .animate-fade-in { animation: fade-in 1s ease-out; }
  .animate-typing { animation: typing 1s infinite; }
  .animate-loading-bar { animation: loading-bar 2s ease-in-out infinite; }
  .animate-float { animation: float 4s ease-in-out infinite; }
`;

export default animations;
