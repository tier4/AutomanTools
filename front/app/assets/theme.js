import { createMuiTheme } from '@material-ui/core/styles';

export const theme = createMuiTheme({
  root: {
    display: 'flex',
    flexWrap: 'wrap'
  },
  palette: {
    primary: {
      light: '#D3EDFB',
      main: '#00a0e9',
      dark: '#008ED3',
      contrastText: '#ffffff'
    },
    secondary: {
      light: '#80E272',
      main: '#4CAF50',
      dark: '#087F23',
      contrastText: '#ffffff'
    }
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"'
    ].join(','),
    fontSize: 16,
    htmlFontSize: 12,
    useNextVariants: true
  }
});
