import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { CSSTransition } from 'react-transition-group'
import { createBuilding, BUILDINGS } from './buildings'
import {
  INFO_BUBBLE_TYPE_RIGHT_BUILDING,
  INFO_BUBBLE_TYPE_LEFT_BUILDING,
  infoBubble
} from '../info_bubble/info_bubble'
import { resumeFadeoutControls } from './resizing'
import { KEYS } from '../app/keyboard_commands'
import { addBuildingFloor, removeBuildingFloor } from '../store/actions/street'

class Building extends React.Component {
  static propTypes = {
    position: PropTypes.string.isRequired,
    addBuildingFloor: PropTypes.func,
    removeBuildingFloor: PropTypes.func,
    street: PropTypes.object,
    buildingWidth: PropTypes.number,
    calculateBuildingPerspective: PropTypes.func
  }

  constructor (props) {
    super(props)

    this.state = {
      variant: (props.position === 'left') ? 'leftBuildingVariant' : 'rightBuildingVariant',
      height: (props.position === 'left') ? 'leftBuildingHeight' : 'rightBuildingHeight',
      oldBuildingEnter: true,
      newBuildingEnter: false,
      switchBuildings: false
    }
  }

  componentDidUpdate (prevProps, prevState) {
    const { street, position } = this.props
    const { variant, height } = this.state

    const lastOverflow = (prevProps.street.remainingWidth < 0)
    const streetOverflow = (street.remainingWidth < 0)

    if (prevProps.street[height] !== street[height] || lastOverflow !== streetOverflow) {
      createBuilding(this.streetSectionBuilding, street[variant], position, street[height], street)
    }

    if (prevProps.street[variant] && prevProps.street[variant] !== street[variant]) {
      this.switchBuildings()
    }

    if (prevState.switchBuildings !== this.state.switchBuildings) {
      this.props.calculateBuildingPerspective(this.oldStreetSectionBuilding)
      this.props.calculateBuildingPerspective(this.streetSectionBuilding)
      this.oldStreetSectionBuilding.classList.remove('hover')
      createBuilding(this.streetSectionBuilding, street[variant], position, street[height], street)
    }
  }

  onBuildingMouseEnter = (event) => {
    window.addEventListener('keydown', this.handleKeyDown)
    let type
    if (this.props.position === 'left') {
      type = INFO_BUBBLE_TYPE_LEFT_BUILDING
    } else if (this.props.position === 'right') {
      type = INFO_BUBBLE_TYPE_RIGHT_BUILDING
    }

    infoBubble.considerShowing(event, this.streetSectionBuilding, type)
    resumeFadeoutControls()
  }

  onBuildingMouseLeave = (event) => {
    window.removeEventListener('keydown', this.handleKeyDown)
    if (infoBubble.considerSegmentEl === this.streetSectionBuilding) {
      infoBubble.dontConsiderShowing()
    }
  }

  handleKeyDown = (event) => {
    const negative = (event.keyCode === KEYS.MINUS) ||
      (event.keyCode === KEYS.MINUS_ALT) ||
      (event.keyCode === KEYS.MINUS_KEYPAD)

    const positive = (event.keyCode === KEYS.EQUAL) ||
      (event.keyCode === KEYS.EQUAL_ALT) ||
      (event.keyCode === KEYS.PLUS_KEYPAD)

    const variant = this.props.street[this.state.variant]
    const hasFloors = BUILDINGS[variant].hasFloors

    if (negative && hasFloors) {
      this.props.removeBuildingFloor(this.props.position)
    } else if (positive && hasFloors) {
      this.props.addBuildingFloor(this.props.position)
    }

    event.preventDefault()
  }

  changeRefs = (ref, isOldBuilding) => {
    if (!this.state.switchBuildings && !isOldBuilding) return

    if (this.state.switchBuildings && isOldBuilding) {
      this.oldStreetSectionBuilding = ref
    } else {
      this.streetSectionBuilding = ref
    }
  }

  switchBuildings = () => {
    this.setState({
      switchBuildings: !(this.state.switchBuildings),
      newBuildingEnter: !(this.state.newBuildingEnter),
      oldBuildingEnter: !(this.state.oldBuildingEnter)
    })
  }

  renderBuilding = (building) => {
    const isOldBuilding = (building === 'old')

    const style = {
      [this.props.position]: (-this.props.buildingWidth + 25) + 'px',
      width: this.props.buildingWidth + 'px'
    }

    const hoverStyle = {}
    if (this.props.position === 'left') {
      hoverStyle.right = '25px'
    } else {
      hoverStyle.left = '25px'
    }

    return (
      <section
        className="street-section-building"
        ref={(ref) => { this.changeRefs(ref, isOldBuilding) }}
        onMouseEnter={this.onBuildingMouseEnter}
        onMouseLeave={this.onBuildingMouseLeave}
        style={style}
      >
        <div className="hover-bk" style={hoverStyle} />
      </section>
    )
  }

  render () {
    const { newBuildingEnter, oldBuildingEnter } = this.state

    return (
      <div>
        <CSSTransition
          key="new-building"
          in={newBuildingEnter}
          timeout={250}
          classNames="switching-in"
          onEntered={this.switchBuildings}
          unmountOnExit
        >
          { this.renderBuilding('new') }
        </CSSTransition>
        <CSSTransition
          key="old-building"
          in={oldBuildingEnter}
          timeout={250}
          classNames="switching-away"
          unmountOnExit
        >
          { this.renderBuilding('old') }
        </CSSTransition>
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    street: state.street
  }
}

function mapDispatchToProps (dispatch) {
  return {
    removeBuildingFloor: (...args) => { dispatch(removeBuildingFloor(...args)) },
    addBuildingFloor: (...args) => { dispatch(addBuildingFloor(...args)) }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Building)
