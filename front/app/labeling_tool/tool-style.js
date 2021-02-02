import orange from '@material-ui/core/colors/orange';
import red from '@material-ui/core/colors/red';
import blue from '@material-ui/core/colors/blue';
import green from '@material-ui/core/colors/green';
import grey from '@material-ui/core/colors/grey';

 
// toolbar status
export const appBarHeight = 54;
// sidebar status
export const drawerWidth = 160;
const toolHeight = `calc(100% - ${appBarHeight}px)`;
const listHead = 20;
export const toolStyle = theme => ({
  drawer: {
    width: drawerWidth,
    marginTop: appBarHeight,
    overflow: 'auto'
  },
  colorPane: {
    width: 18,
    height: 18,
    borderRadius: 2,
  },
  list: {
    overflow: 'auto',
    height: '100%',
    position: 'relative'
  },
  listHead: {
    backgroundColor: '#eee',
    color: '#000',
    height: listHead,
    lineHeight: listHead+'px'
  },
  listItem: {
    height: listHead
  },
  selectedListItem: {
    backgroundColor: '#eee',
  },
  appBar: {
    width: '100%',
    height: appBarHeight
  },
  gridContainer: {
    height: appBarHeight,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
  },
  gridItem: {
    textAlign: 'center',
  },
  gridKlassSet: {
    flexGrow: 1,
  },
  gridExitButton: {
    marginRight: 5,
  },
  frameNumberParts: {
    color: '#000',
    backgroundColor: '#fff',
    borderRadius: 5,
    width: 360,
    display: 'flex',
    alignItems: 'center',
    marginRight: 5,
    marginLeft: 20
  },
  frameNumber: {
    width: 100,
    textAlign: 'center'
  },
  frameSkip: {
    width: 50
  },
  annotationWrapper: {
  },
  toolControlsWrapper: {
    height: toolHeight,
    overflowY: 'none',
    display: 'flex',
    flexDirection: 'column'
  },
  toolControls: {
    textAlign: 'center'
  },
  activeTool: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)'
  },
  labelList: {
    flexGrow: 1,
    overflowY: 'auto'
  },
  klassSetList: {
    textAlign: 'center',
    margin: 'auto',
  },
  content: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth*2}px)`,
    overflow: 'hidden'
  }
});
