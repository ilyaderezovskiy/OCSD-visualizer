import { Typography, Box } from "@mui/material";

const Header = ({ title, subtitle }) => {
  return (
    <Box mb="30px"
      sx={{
        display: "flex",
        justifyContent: "space-between",
      }}>

    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        flexDirection: "column",
        p: 0.5,
        m: 0.5,
      }}>
          
    <Typography
      variant="h4"
      color="#453f32"
      fontWeight="bold"
      sx={{ m: "0 0 5px 0" }}>
      {title}
    </Typography>

    <Typography variant="h6" color="#453f32">
      {subtitle}
    </Typography>
    </Box>

    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        flexDirection: "column",
        p: 1,
        m: 1,
      }}>
          
    <Typography variant="h6" color="#453f32">
      {localStorage.getItem("name")}
    </Typography>
    </Box>
    </Box>
  );
};

export default Header;