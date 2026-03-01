import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Typography, Modal, IconButton } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import axios from "axios";
import { clsx } from "clsx";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";
import gsap from "gsap";
import { useNavigate, useSearchParams } from "react-router-dom";
import ConfettiExplosion from "react-confetti-explosion";

import CollegeModal from "../../components/CollegeModal/CollegeModal";
import AnswerModal from "../../components/AnswerModal/AnswerModal";
import SummaryModal from "../../components/SummaryModal/SummaryModal";
import ArchiveModal from "../../components/ArchiveModal/ArchiveModal";
import GoogleSignIn from "../../components/GoogleSignIn/GoogleSignIn";
import DailyLeaderboard from "../../components/DailyLeaderboard/DailyLeaderboard";
import { useAuth } from "../../context/AuthContext";

import useStyles from "./styles";
import { GameSetting, PlayerInfo } from "../../models/interface";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  getCollegeList,
  getHistoryList,
  setHistory,
} from "../../reducers/game.slice";
import {
  DECREASE_TIME,
  DURATION_TIME,
  MAX_COUNT,
  SERVER_URL,
  Version,
} from "../../config/config";
import {
  getRemainTimeStr,
  getStartTimeByTimestampDaily,
} from "../../utils/utils";
import { PlayType, PlayTypeInfo } from "../../constant/const";
import isMobile from "is-mobile";

const GameBoardIndex = ({ playType }: { playType: PlayType }) => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const timeStampParam = getStartTimeByTimestampDaily(
    searchParams.get("timestamp")
      ? Number(searchParams.get("timestamp"))
      : Math.floor(new Date().getTime() / 1000)
  );
  const dispatch = useAppDispatch();

  const { user, setUsername } = useAuth();
  const [targetItem, setTargetItem] = useState<PlayerInfo | null>(null);

  const [open, setOpen] = useState(false);
  const [answerOpen, setAnswerOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
const [infoOpen, setInfoOpen] = useState(() => {
    const hasVisited = localStorage.getItem("alumniGridVisited");
    if (!hasVisited) {
      localStorage.setItem("alumniGridVisited", "true");
      return true;
    }
    return false;
  });
  const [usernameOpen, setUsernameOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const [isConfirming, setIsConfirming] = useState(false);
  const [remainTime, setRemainTime] = useState(0);
  const [spentTime, setSpentTime] = useState(0);
  const [explosion, setExplosion] = useState(false);

  const [scoreSubmitted, setScoreSubmitted] = useState(false);
const gameStartedRef = useRef(false);
const infoModalRef = useRef(null);
  const [percentile, setPercentile] = useState<number | null>(null);
  const [totalPlayers, setTotalPlayers] = useState<number>(0);

  const [gameSetting, setGameSetting] = useState<GameSetting>({
    createTime: 0,
    remainCount: MAX_COUNT,
    score: 0,
    endStatus: false,
    playerList: [],
    gameStartTime: 0,
  });

  const { history, isGettingHistory } = useAppSelector((state) => state.game);

  const handleLink = () => {
    if (playType === PlayType.NBA) {
      window.location.href = "/game/nfl";
    } else if (playType === PlayType.NFL) {
      window.location.href = "/game/nba";
    }
  };

  const updateGameSetting = (newSetting: Partial<GameSetting>) =>
    setGameSetting((prev) => ({ ...prev, ...newSetting }));

  const handleCollegeSelect = useCallback(
    async (collegeName: string) => {
      if (!targetItem) return;
      setIsConfirming(true);

      try {
        const response = await axios.post(
          `${SERVER_URL}/game/college/${playType}`,
          {
            id: targetItem.playerId,
            college: collegeName,
            timestamp: timeStampParam,
          }
        );

        const status = response.data.message as boolean;

        updateGameSetting({
          playerList: gameSetting.playerList.map((player) =>
            player.playerId !== targetItem.playerId
              ? player
              : {
                  ...player,
                  ...(status
                    ? { rightStatus: collegeName }
                    : {
                        wrongStatus: [
                          ...(player.wrongStatus || []),
                          collegeName,
                        ],
                      }),
                }
          ),
          remainCount: gameSetting.remainCount - 1,
          score: status
            ? gameSetting.score +
              Math.max(100 - Math.floor(spentTime / DECREASE_TIME), 0)
            : gameSetting.score,
        });

        if (status) {
          setOpen(false);
          setExplosion(true);
        }
      } catch (err) {
        console.error("Error fetching game/college post:", err);
      } finally {
        setIsConfirming(false);
      }
    },
    [spentTime, targetItem, playType, timeStampParam, gameSetting]
  );

  const loadGameData = useCallback(() => {
    if (history.items.length === 0) return;

    const savedData = localStorage.getItem(
      `dataList-${PlayTypeInfo[playType].up}${Version}`
    );

    if (savedData) {
      try {
        const dataList = JSON.parse(savedData) as GameSetting[];
        console.log("Parsed localstorage data:", dataList);
        const currentGameData = dataList.find(
          (item) => item.createTime === history.startTimestamp
        );

        for (const player of currentGameData.playerList) {
          const historyInfo = history.items.find(
            (item) => item.playerId === player.playerId
          );
          if (historyInfo) {
            player.imageLink = historyInfo.imageLink;
            player.firstname = historyInfo.firstname;
            player.lastname = historyInfo.lastname;
          }
        }

        if (currentGameData) {
          setGameSetting(currentGameData);
          return;
        }
      } catch (err) {
        console.error("Error parsing local storage data:", err);
      }
    }

    const initialSetting: GameSetting = {
      playerList: history.items,
      remainCount: MAX_COUNT,
      score: 0,
      createTime: history.startTimestamp,
      endStatus: false,
      gameStartTime: Math.floor(Date.now() / 1000),
    };
    updateGameSetting(initialSetting);

if (!gameStartedRef.current) {
      gameStartedRef.current = true;
      axios.post(`${SERVER_URL}/game/gamestart/${playType}`, {
        timestamp: timeStampParam,
      });
    }
  }, [history, timeStampParam, playType]);

  const handleEndGame = useCallback(() => {
    updateGameSetting({ endStatus: true });
    setSummaryOpen(true);
  }, []);

  const selectItem = useCallback(
    (item: PlayerInfo) => {
      setTargetItem(item);
      setAnswerOpen(gameSetting.endStatus);
      setOpen(!gameSetting.endStatus);
    },
    [gameSetting.endStatus]
  );

  const saveDailyData = useCallback(() => {
    const dataList = JSON.parse(
      localStorage.getItem(`dataList-${PlayTypeInfo[playType].up}${Version}`) ||
        "[]"
    ) as GameSetting[];

    const updatedData = dataList.filter(
      (item) => item.createTime !== gameSetting.createTime
    );
    updatedData.push(gameSetting);

    localStorage.setItem(
      `dataList-${PlayTypeInfo[playType].up}${Version}`,
      JSON.stringify(updatedData)
    );
  }, [playType, gameSetting]);

  const submitScoreToLeaderboard = useCallback(async () => {
    if (!user || !gameSetting.endStatus || scoreSubmitted) return;
    try {
      await axios.post(`${SERVER_URL}/leaderboard/submit`, {
        userId: user.id,
        score: gameSetting.score,
        playType: playType,
        timestamp: timeStampParam,
      });
      setScoreSubmitted(true);
    } catch (err) {
      console.error("Failed to submit score:", err);
    }
  }, [user, gameSetting.endStatus, gameSetting.score, playType, timeStampParam, scoreSubmitted]);

  const fetchPercentile = useCallback(async () => {
    if (!gameSetting.endStatus) return;
    try {
      const response = await axios.get(
        `${SERVER_URL}/leaderboard/percentile/${gameSetting.score}/${playType}/${timeStampParam}`
      );
      if (response.data.status === 200) {
        setPercentile(response.data.data.percentile);
        setTotalPlayers(response.data.data.totalPlayers);
      }
    } catch (err) {
      console.error("Failed to fetch percentile:", err);
    }
  }, [gameSetting.endStatus, gameSetting.score, playType, timeStampParam]);

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  useEffect(() => {
    if (gameSetting.createTime === 0) return;
    saveDailyData();
  }, [gameSetting, saveDailyData]);

  useEffect(() => {
    if (gameSetting.playerList.length > 0 && targetItem) {
      const updatedItem = gameSetting.playerList.find(
        (item) => item.playerId === targetItem.playerId
      );
      setTargetItem(updatedItem);
    }
  }, [gameSetting.playerList, targetItem]);

  useEffect(() => {
    if (gameSetting.remainCount === 0) {
      handleEndGame();
    }
  }, [gameSetting.remainCount, handleEndGame]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainTime(
        DURATION_TIME - new Date().getTime() / 1000 + gameSetting.createTime
      );
      setSpentTime(new Date().getTime() / 1000 - gameSetting.gameStartTime);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [gameSetting.createTime, gameSetting.gameStartTime]);

  useEffect(() => {
    dispatch(getCollegeList({ playType }));
    dispatch(getHistoryList({ timestamp: Number(timeStampParam), playType }));
  }, [dispatch, searchParams, timeStampParam, playType]);

  useEffect(() => {
    if (gameSetting.endStatus) {
      setSummaryOpen(true);
    } else {
      setSummaryOpen(false);
    }
  }, [gameSetting.endStatus, gameSetting.createTime]);

  useEffect(() => {
    return () => {
      dispatch(setHistory());
    };
  }, [dispatch]);

  useEffect(() => {
    if (explosion) {
      setTimeout(() => {
        setExplosion(false);
      }, 5000);
    }
  }, [explosion]);
useEffect(() => {
    if (user && !user.username) {
      setUsernameOpen(true);
    }
  }, [user]);
  useEffect(() => {
    if (gameSetting.endStatus && user && !scoreSubmitted) {
      submitScoreToLeaderboard();
    }
  }, [gameSetting.endStatus, user, scoreSubmitted, submitScoreToLeaderboard]);

  useEffect(() => {
    if (gameSetting.endStatus) {
      fetchPercentile();
    }
  }, [gameSetting.endStatus, fetchPercentile]);

  return (
    <Box
      className={clsx(
        classes.gameBoard,
        playType === PlayType.NBA ? classes.nbaBg : classes.nflBg
      )}
    >
{(user || !gameSetting.endStatus) && (
      <Box sx={{ position: "absolute", top: "24px", left: { xs: "50%", md: "10px" }, transform: { xs: "translateX(-50%)", md: "none" }, zIndex: 10 }}>
        <GoogleSignIn />
      </Box>
      )}
     
     
      <Box className={classes.buttonContainer}>
        <Button
          className={classes.infoButton}
          variant="contained"
          onClick={() => setInfoOpen(true)}
        >
          <Box className={classes.infoIcon}>
            <InfoIcon />
          </Box>{" "}
          <Box className={classes.onlyDesktop}>Info</Box>
        </Button>
        <Button
          className={clsx(
            classes.linkButton,
            playType === PlayType.NBA ? classes.nflColor : classes.nbaColor
          )}
          variant="contained"
          onClick={handleLink}
        >
          {isMobile() ? (
            <Box sx={{ fontSize: "20px" }}>
              {playType === PlayType.NBA ? "🏈" : "🏀"}
            </Box>
          ) : playType === PlayType.NBA ? (
            "NFL Grid 🏈"
          ) : (
            "NBA Grid 🏀"
          )}
        </Button>
      </Box>
      <Box className={classes.leftPanel}></Box>
      <Box className={classes.middlePanel}>
        <Typography variant="h3" className={classes.gameTitle}>
          AlumniGrid - {PlayTypeInfo[playType].up}
        </Typography>
        <Box className={classes.gridBox}>
          {isGettingHistory
            ? gameSetting.playerList.map((item, index) => (
                <Box
                  className={clsx(
                    classes.gridItem,
                    item.rightStatus !== "none"
                      ? classes.correctBox
                      : gameSetting.endStatus
                      ? classes.wrongBox
                      : null
                  )}
                  onClick={() => selectItem(item)}
                  key={index}
                >
                  <PersonIcon className={classes.personAva} />
                </Box>
              ))
            : gameSetting.playerList.map((item, index) => (
                <Box
                  className={clsx(
                    classes.gridItem,
                    item.rightStatus !== "none"
                      ? classes.correctBox
                      : gameSetting.endStatus
                      ? classes.wrongBox
                      : null
                  )}
                  onClick={() => selectItem(item)}
                  key={index}
                >
                  <Box
                    component={"img"}
                    src={item.imageLink}
                    className={classes.playerImage}
                  ></Box>
                  <Box
                    className={
                      item.imageLink
                        ? classes.playerName
                        : classes.playerNameWithNoImg
                    }
                  >
                    {item.firstname} {item.lastname}
                  </Box>
                </Box>
              ))}
        </Box>
      </Box>
      <Box className={classes.rightPanel}>
        {!gameSetting.endStatus && (
          <Box sx={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Box className={classes.guessLeftTxt}>GUESSES LEFT</Box>
            <Box className={classes.score}>{gameSetting.remainCount}</Box>
          </Box>
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Box className={classes.guessLeftTxt}>SCORE</Box>
          <Box className={classes.score}>{gameSetting.score}</Box>
        </Box>
        {gameSetting.endStatus && percentile !== null && totalPlayers > 0 && (
          <Typography sx={{
            color: "#4CAF50",
            fontSize: "13px",
            textAlign: "center",
            marginTop: "4px",
          }}>
            You beat {percentile}% of users today
          </Typography>
        )}
        {!gameSetting.endStatus && (
          <>
            <Button
              className={classes.giveUpBtn}
              variant="contained"
              onClick={handleEndGame}
            >
              Give Up
            </Button>
          </>
        )}
        {gameSetting.endStatus && (
          <Box sx={{ marginTop: "12px", textAlign: "center", color: "white" }}>
            <Typography variant="body2" sx={{ marginBottom: "8px" }}>
              Click into boxes to see the correct answer.
            </Typography>
            <Typography variant="body2">
              Click <b>Show Summary</b> to view stats and share your grid with
              friends!
            </Typography>
          </Box>
        )}
        <Box className={classes.remainTime}>
          {gameSetting.endStatus
            ? `New Grid in ${getRemainTimeStr(remainTime)}`
            : getRemainTimeStr(spentTime)}
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {gameSetting.endStatus && (
            <Button
              variant="contained"
              sx={{ textTransform: "none" }}
              onClick={() => setSummaryOpen(true)}
            >
              Show Summary
            </Button>
          )}
          {gameSetting.endStatus && (
            <Button
              variant="contained"
              sx={{ textTransform: "none" }}
              onClick={() => setShowLeaderboard(true)}
            >
              Daily Leaderboard
            </Button>
          )}

          {user && gameSetting.endStatus && scoreSubmitted && (
            <Typography sx={{ color: "#4CAF50", fontSize: "12px", marginTop: "4px", textAlign: "center" }}>
              Score submitted to leaderboard!
            </Typography>
          )}
          <Button
            variant="contained"
            sx={{ textTransform: "none" }}
            onClick={() => setArchiveOpen(true)}
          >
Prior Grids
          </Button>
          {!user && gameSetting.endStatus && (
            <Box sx={{
              textAlign: "center",
              padding: "10px 16px",
              marginTop: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}>
              <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "8px" }}>
                Sign in to submit your score to the leaderboard!
              </Typography>
              <GoogleSignIn />
            </Box>
          )}
        </Box>
        <Box
          sx={{
            maxWidth: 300,
            color: "white",
            opacity: 0.8,
            fontSize: 14,
            marginTop: 3,
          }}
        >
          Please note: ALUMNUSGRID LLC does not own any of the team, league or
          event logos depicted within this site. All sports logos contained
          within this site are properties of their respective leagues, teams,
          ownership groups and/or organizations.
        </Box>
      </Box>
      <CollegeModal
        open={open}
        handleOpenStatus={(open) => setOpen(open)}
        handleCollegeSelect={handleCollegeSelect}
        targetItem={targetItem}
        isConfirming={isConfirming}
      />
      <AnswerModal
        open={answerOpen}
        itemId={targetItem?.playerId}
        handleOpenStatus={(answerOpen) => setAnswerOpen(answerOpen)}
        playType={playType}
      />
      <SummaryModal
        open={summaryOpen}
        onClose={(summaryOpen) => setSummaryOpen(summaryOpen)}
        gameSetting={gameSetting}
        playType={playType}
        percentile={percentile}
        totalPlayers={totalPlayers}
      />
<Modal open={infoOpen} onClose={() => setInfoOpen(false)} slotProps={{ backdrop: { sx: { backgroundColor: "rgba(0, 0, 0, 0.3)" } } }}>
<Box sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          padding: { xs: "24px", md: "32px" },
          width: { xs: "85%", md: "500px" },
          maxHeight: { xs: "80vh", md: "85vh" },
          overflowY: "auto",
          textAlign: "center",
        }}>
          <IconButton
            aria-label="close"
            onClick={() => setInfoOpen(false)}
            sx={{ position: "absolute", top: 8, right: 8 }}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: "bold", marginBottom: "16px" }}>
            Welcome to the AlumniGrid
          </Typography>
          <Typography sx={{ fontSize: "14px", color: "#333", textAlign: "left", lineHeight: 1.8 }}>
            AlumniGrid is a daily sports trivia game.
            <br /><br />
            Each day, 9 squares containing an athlete's name are prompted.
            <br /><br />
            Players tap into each square and guess where each athlete went to college.
            <br /><br />
            If the athlete did not go to college, guess the high school or last school the athlete attended.
            <br /><br />
            If the athlete went to multiple colleges, guess the most recent school attended.
            <br /><br />
            Max 9 guesses per day.
            <br />
            Max 100 points per box for a correct answer.
            <br />
            The faster you complete, the higher the possible score.
            <br /><br />
            Head over to the summary page to share your grid with friends, view statistics, and play prior day grids!
            <br /><br />
            <strong>Come back tomorrow for a new grid! Refreshes at 12am PST</strong>
            <br /><br />
           <strong>Note: The game is currently in beta. NBA and NFL grids are available at this time. Stay tuned…</strong>
          </Typography>
          <Box sx={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "24px" }}>
            <Button
              variant="contained"
              sx={{ textTransform: "none", backgroundColor: "#1976d2" }}
              onClick={() => {
                setInfoOpen(false);
                if (playType !== PlayType.NBA) window.location.href = "/game/nba";
              }}
            >
              Start NBA 🏀
            </Button>
            <Button
              variant="contained"
              sx={{ textTransform: "none", backgroundColor: "#388e3c" }}
              onClick={() => {
                setInfoOpen(false);
                if (playType !== PlayType.NFL) window.location.href = "/game/nfl";
              }}
            >
             Start NFL 🏈
          </Button>
          </Box>
          <Typography sx={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
            Click on the sport icons to switch grids
          </Typography>
          <Typography sx={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
            Sign in with Google to compete on the daily leaderboard!
          </Typography>
        </Box>
      </Modal>
<Modal open={usernameOpen} onClose={() => {}} slotProps={{ backdrop: { sx: { backgroundColor: "rgba(0, 0, 0, 0.5)" } } }}>
        <Box sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          padding: { xs: "24px", md: "32px" },
          width: { xs: "85%", md: "400px" },
          textAlign: "center",
        }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: "8px" }}>
            Choose a Username
          </Typography>
          <Typography sx={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
            This will be shown on the leaderboard
          </Typography>
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => {
              setUsernameInput(e.target.value);
              setUsernameError("");
            }}
            placeholder="Enter username (3-20 characters)"
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: "14px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: "8px",
            }}
          />
          {usernameError && (
            <Typography sx={{ color: "red", fontSize: "12px", marginBottom: "8px" }}>
              {usernameError}
            </Typography>
          )}
          <Button
            variant="contained"
            sx={{ textTransform: "none", marginTop: "8px" }}
            onClick={async () => {
              try {
                const success = await setUsername(usernameInput);
                if (success) {
                  setUsernameOpen(false);
                }
              } catch (err: any) {
                setUsernameError(err.message || "Failed to set username");
              }
            }}
          >
            Save Username
          </Button>
        </Box>
      </Modal>
      <ArchiveModal
        open={archiveOpen}
        onClose={(archiveOpen) => setArchiveOpen(archiveOpen)}
        playType={playType}
      />
<Modal open={showLeaderboard} onClose={() => setShowLeaderboard(false)} slotProps={{ backdrop: { sx: { backgroundColor: "rgba(0, 0, 0, 0.3)" } } }}>
<Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          <DailyLeaderboard
            playType={playType}
            timestamp={timeStampParam}
            onClose={() => setShowLeaderboard(false)}
          />
        </Box>
      </Modal>
      {showLeaderboard && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1000,
          }}
          onClick={() => setShowLeaderboard(false)}
        >
          <Box onClick={(e) => e.stopPropagation()}>
            <DailyLeaderboard
              playType={playType}
              timestamp={timeStampParam}
              onClose={() => setShowLeaderboard(false)}
            />
          </Box>
        </Box>
      )}
      {explosion && (
        <ConfettiExplosion
          duration={3000}
          zIndex={5}
          width={1300}
          height={"100vh"}
          style={{ position: "absolute", top: "0", left: "50%" }}
        />
      )}
    </Box>
  );
};

export default GameBoardIndex;
