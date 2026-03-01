import React, { useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { Box, Button, Typography, Avatar } from "@mui/material";

const GOOGLE_CLIENT_ID =
  "1027369926370-3ndj481675ii3e8egkpnsgl9ns8lcm8f.apps.googleusercontent.com";

const GoogleSignIn: React.FC = () => {
  const { user, login, logout } = useAuth();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleCredentialResponse = useCallback(
    async (response: any) => {
      try {
        await login(response.credential);
      } catch (err) {
        console.error("Google sign-in error:", err);
      }
    },
    [login]
  );

  useEffect(() => {
    if (user) return;

    const initGoogle = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });
        if (googleBtnRef.current) {
          (window as any).google.accounts.id.renderButton(
            googleBtnRef.current,
            {
              theme: "outline",
              size: "medium",
              type: "standard",
              shape: "rectangular",
              text: "signin_with",
              width: 200,
            }
          );
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);

    return () => {};
  }, [user, handleCredentialResponse]);

  if (user) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <Avatar
          src={user.picture}
          alt={user.name}
          sx={{ width: 28, height: 28 }}
        />
        <Typography
          sx={{
            color: "white",
            fontSize: "13px",
            maxWidth: "100px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {user.name.split(" ")[0]}
        </Typography>
        <Button
          onClick={logout}
          size="small"
          sx={{
            color: "white",
            fontSize: "11px",
            minWidth: "auto",
            padding: "2px 8px",
            textTransform: "none",
            opacity: 0.7,
            "&:hover": { opacity: 1 },
          }}
        >
          Sign Out
        </Button>
      </Box>
    );
  }

  return <div ref={googleBtnRef} />;
};

export default GoogleSignIn;
