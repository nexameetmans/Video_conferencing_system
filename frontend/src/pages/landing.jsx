import "../App.css";
import { Link, useNavigate } from "react-router-dom";

export default function LandingPage() {
  const router = useNavigate();

  return (
    <div className="landingPageContainer">
      <nav>
        <Link to="/" className="navHeader">
          <h2>NexaMeet</h2>
        </Link>
        <div className="navlist">
          <p onClick={() => router("/aljk23")}>Join as Guest</p>
          <p onClick={() => router("/auth", { state: { mode: "register" } })}>Register</p>
          <div className="navLoginBtn" onClick={() => router("/auth", { state: { mode: "login" } })} role="button">
            Login
          </div>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div className="heroTextContent">
          <h1>
            <span>Connect, Collaborate</span><br />and Communicate Smarter
          </h1>
          <p>Experience real-time transcription and AI-generated summaries with NexaMeet.</p>
          <div role="button">
            <Link to="/auth" state={{ mode: "register" }}>Get Started →</Link>
          </div>
        </div>
        <div className="heroImageContainer">
          <img src="/mobile.png" alt="NexaMeet video conferencing interface" />
        </div>
      </div>
    </div>
  );
}
