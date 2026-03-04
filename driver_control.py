# VEX IQ 2nd Gen - Arcade Driver Control
# Right stick to turn, right trigger forward, left trigger reverse
# Can turn and drive at the same time

while True:
    # Get turn value from right stick horizontal (-100 to 100)
    turn = controller.axisD.position()

    # Get drive value from triggers
    drive = 0
    if controller.buttonRUp.pressing():
        drive = 50  # Forward at 50%
    elif controller.buttonLUp.pressing():
        drive = -50  # Reverse at 50%

    # Calculate left and right motor speeds (arcade drive)
    left_speed = drive + turn
    right_speed = drive - turn

    # Apply to motors
    if left_speed != 0:
        left_motor.spin(FORWARD, left_speed, PERCENT)
    else:
        left_motor.stop()

    if right_speed != 0:
        right_motor.spin(FORWARD, right_speed, PERCENT)
    else:
        right_motor.stop()

    wait(20, MSEC)
