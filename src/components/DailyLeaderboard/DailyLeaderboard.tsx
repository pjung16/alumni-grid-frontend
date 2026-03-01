import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  CircularProgress,
  Button,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import axios from "axios";
import { SERVER_URL } from "../../config/config";
import { PlayType, PlayTypeInfo } from "../../constant/const";
import { useAuth } from "../../context/AuthContext";
import gsap from "gsap";

interface LeaderboardEntry {
  id: number;
  userId: number;
  score: number;
  playType: number;
  timestamp: number;
  User: {
    id: number;
    name: string;
    picture: string;
  };
}

const DailyLeaderboard: React.FC<{
  playType: PlayType;
  timestamp: number;
  onClose?: () => void;
}> = ({ playType, timestamp, onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
const modalRef = useRef(null);
useEffect(() => {
    if (modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
    }
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(
          `${SERVER_URL}/leaderboard/${playType}/${timestamp}`
        );
        if (response.data.status === 200) {
          setEntries(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [playType, timestamp]);

  const getMedalColor = (rank: number) => {
    if (rank === 0) return "#FFD700";
    if (rank === 1) return "#C0C0C0";
    if (rank === 2) return "#CD7F32";
    return "transparent";
  };

  return (
   <Box
      ref={modalRef}
      sx={{
        opacity: 0,
background: "white",
        borderRadius: "12px",
        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.3)",
        padding: "32px",
        width: { xs: "85%", md: "400px" },
        maxHeight: { xs: "500px", md: "550px" },
        overflowY: "auto",
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
       <Typography
          sx={{
            color: "#333",
            fontSize: "15px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            whiteSpace: "nowrap",
          }}
        >
          <EmojiEventsIcon sx={{ color: "#FFD700" }} />
          Daily Leaderboard - {PlayTypeInfo[playType].up}
        </Typography>
        {onClose && (
          <Button
            onClick={onClose}
            sx={{ color: "#333", minWidth: "auto", fontSize: "15px" }}
          >
            ✕
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", padding: "20px" }}>
          <CircularProgress sx={{ color: "#333" }} size={30} />
        </Box>
      ) : entries.length === 0 ? (
        <Typography
          sx={{ color: "rgba(0,0,0,0.5)", textAlign: "center", padding: "20px" }}
        >
          No scores yet today. Be the first!
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {entries.map((entry, index) => (
            <Box
              key={entry.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "8px 12px",
                borderRadius: "8px",
                backgroundColor:
                  user?.id === entry.userId
                    ? "rgba(76, 175, 80, 0.2)"
                    : "rgba(255,255,255,0.05)",
                border:
                  user?.id === entry.userId
                    ? "1px solid rgba(76, 175, 80, 0.4)"
                    : "1px solid transparent",
              }}
            >
              <Typography
                sx={{
                  color: getMedalColor(index) !== "transparent"
                    ? getMedalColor(index)
                    : "rgba(255,255,255,0.5)",
                  fontWeight: "bold",
                  fontSize: "16px",
                  minWidth: "28px",
                  textAlign: "center",
                }}
              >
                {index < 3 ? (
                  <EmojiEventsIcon
                    sx={{ color: getMedalColor(index), fontSize: "20px" }}
                  />
                ) : (
                  index + 1
                )}
              </Typography>
              <Avatar
                src={entry.User?.picture}
                alt={entry.User?.name}
                sx={{ width: 32, height: 32 }}
              />
              <Typography
                sx={{
                  color: "#333",
                  fontSize: "14px",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {entry.User?.name}
                {user?.id === entry.userId && (
                  <span style={{ opacity: 0.5, marginLeft: "4px" }}>(You)</span>
                )}
              </Typography>
              <Typography
                sx={{
                  color: "#4CAF50",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                {entry.score}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {!user && (
        <Typography
          sx={{
            color: "rgba(0,0,0,0.4)",
            fontSize: "12px",
            textAlign: "center",
            marginTop: "12px",
          }}
        >
          Sign in with Google to submit your score!
        </Typography>
      )}
    </Box>
  );
};

export default DailyLeaderboard;
