export const sideMenuItems = ['controls', 'toggle-fans']

export const interactableObjNames = ['RearFanBlades', 'RearFanCase', 'FrontTopFanBlades', 'FrontTopFanCase', 'FrontBottomFanBlades', 'FrontBottomFanCase', 'GraphicsCard', 'Ram', 'CpuChip', 'PowerSupply']

export const objectProps = {
  Default: {
    title: 'Keep going!',
    description: 'Click on another component to learn about it'
  },
  RearFan: {
    title: 'Exhaust Fan',
    description: 'Fans are used to move air through the computer case. The components inside the case cannot dissipate heat efficiently if the surrounding air is too hot. <p> Commonly placed on the rear or top of the case, exhaust fans will expel the warm air.',
    position: { x: 1.93, y: 1.49, z: -0.46 }
  },
  FrontTopFan: {
    title: 'Front Top Fan',
    description: 'front top fan',
    position: { x: -2.16, y: 1.22, z: -0.10 }
  },
  FrontBottomFan: {
    title: 'Front Bottom Fan',
    description: 'front bottom fan',
    position: { x: -2.16, y: 0, z: -0.10 },
  },
  GraphicsCard: {
    title: 'Graphics Card',
    description: 'graphics card',
    position: { x: 0.78, y: 0.44, z: 0.19 },
    preRotation: { x: 90 },
    displayRotationAxis: 'z'
  },
  Ram: {
    title: 'Random-Access Memory',
    description: 'A form of computer memory that can be read and changed in any order, typically used to store working data and machine code. <p> A random-access memory device allows data items to be read or written in almost the same amount of time irrespective of the physical location of data inside the memory.',
    position: { x: -0.13, y: 1.53, z: 0.75 },
    preRotation: { x: 90 },
    displayRotationAxis: 'z'
  },
  CpuChip: {
    title: 'Central Processing Unit',
    description: 'A CPU, also called a central processor or main processor, is the electronic circuitry within a computer that executes instructions that make up a computer program. <p> The CPU performs basic arithmetic, logic, controlling, and input/output operations specified by the instructions in the program.',
    position: { x: 0.62, y: 1.45, z: 0.74 }
  },
  PowerSupply: {
    title: 'Power Supply',
    description: 'A power supply unit converts mains AC to low-voltage regulated DC power for the internal components of a computer. Modern personal computers universally use switched-mode power supplies. <p> Some power supplies have a manual switch for selecting input voltage, while others automatically adapt to the mains voltage.',
    position: { x: 1.31, y: -1.19, z: -0.12 }
  }
}
