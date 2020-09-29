import orange from '@material-ui/core/colors/orange';
import red from '@material-ui/core/colors/red';
import blue from '@material-ui/core/colors/blue';
import green from '@material-ui/core/colors/green';
import grey from '@material-ui/core/colors/grey';

 
// toolbar status
export const appBarHeight = 54;
// sidebar status
export const drawerWidth = 160;
const toolHeight = 400;
const listHead = 20;
export const toolStyle = theme => ({
  drawer: {
    width: drawerWidth,
    marginTop: appBarHeight,
    overflow: 'auto'
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
  },
  gridItem: {
    textAlign: 'center',
  },
  frameNumberParts: {
    color: '#000',
    backgroundColor: '#fff',
    borderRadius: 5,
    width: 260,
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
    height: '100%',
  },
  toolControlsWrapper: {
    height: toolHeight,
    overflowY: 'scroll'
  },
  toolControls: {
    textAlign: 'center'
  },
  activeTool: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)'
  },
  labelList: {
    height: `calc(100% - ${toolHeight})`
  },
  klassSetList: {
    textAlign: 'center',
    margin: 'auto',
  },
  colorPane: {
    width: 18,
    height: 18,
    borderRadius: 2
  },
  content: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth*2}px)`,
    overflow: 'hidden'
  }
});
