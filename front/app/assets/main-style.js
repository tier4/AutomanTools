import orange from '@material-ui/core/colors/orange';
import red from '@material-ui/core/colors/red';
import blue from '@material-ui/core/colors/blue';
import green from '@material-ui/core/colors/green';
import grey from '@material-ui/core/colors/grey';
const drawerWidth = 240;
export const mainStyle = theme => ({
  info: { color: blue[500], fontWeight: 900 },
  warn: { color: orange[500], fontWeight: 900 },
  success: { color: green[500], fontWeight: 900 },
  error: { color: red[500], fontWeight: 900 },
  unknown: { color: grey[500], fontWeight: 900 },
  grow: {
    flexGrow: 1
  },
  formGroupFlex: {
    margin: theme.spacing(1),
    display: 'flex'
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120
  },
  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1)
  },
  toolbar: {
    paddingRight: 24 // keep right padding when drawer closed
  },
  appBar: {
    backgroundColor: '#fff',
    color: '#000',
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    })
  },
  button: {
    margin: theme.spacing(1)
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 36
  },
  hide: {
    display: 'none'
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0
  },
  drawerPaper: {
    width: drawerWidth
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end'
  },
  dialogPaper: {
    margin: 5,
    padding: 5
  },
  table: {
    minWidth: 500
  },
  tableWrapper: {
    padding: theme.spacing(2)
  },
  popover: {
    pointerEvents: 'none'
  },
  popoverText: {
    pointerEvents: 'none',
    padding: 3
  },
  tableActionButton: {
    marginTop: -10,
    marginBottom: -10,
    marginLeft: 1,
    marginRight: 1,
    minHeight: '30px',
    padding: '0 0px'
  },
  tableProgress: {
    marginTop: -4,
    marginBottom: 0,
    minHeight: '10px',
    padding: '0 0px'
  },
  tableProgressStr: {
    marginTop: 0,
    marginBottom: -6,
    minHeight: '10px',
    padding: '0 0px'
  },
  fab: {
    margin: theme.spacing(1)
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    marginLeft: -drawerWidth
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    }),
    marginLeft: 0
  }
});
