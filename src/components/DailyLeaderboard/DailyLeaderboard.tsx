import React, { useEffect, useState } from "react";
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
      sx={{
        backgroundColor: "rgba(0,0,0,0.85)",
        borderRadius: "12px",
        padding: "20px",
        maxWidth: "400px",
        width: "100%",
        maxHeight: "500px",
        overflow: "auto",
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
            color: "white",
            fontSize: "18px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <EmojiEventsIcon sx={{ color: "#FFD700" }} />
          Daily Leaderboard - {PlayTypeInfo[playType].up}
        </Typography>
        {onClose && (
          <Button
            onClick={onClose}
            sx={{ color: "white", minWidth: "auto", fontSize: "18px" }}
          >
            ✕
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", padding: "20px" }}>
          <CircularProgress sx={{ color: "white" }} size={30} />
        </Box>
      ) : entries.length === 0 ? (
        <Typography
          sx={{ color: "rgba(255,255,255,0.6)", textAlign: "center", padding: "20px" }}
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
                  color: "white",
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
            color: "rgba(255,255,255,0.5)",
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
