# VEX IQ 2nd Gen Python Test Program
# Tests: drive forward, spin, and distance sensor reading

# Note: In VEXcode IQ, the drivetrain and sensors are typically
# configured in the Devices menu. The names below assume default configuration.

def robot_test():
    """
    Test function that drives forward, spins, and takes a distance reading.
    """
    # Drive forward for 200 millimeters
    drivetrain.drive_for(FORWARD, 200, MM)

    # Wait briefly
    wait(0.5, SECONDS)

    # Spin (turn) right for 90 degrees
    drivetrain.turn_for(RIGHT, 90, DEGREES)

    # Wait briefly
    wait(0.5, SECONDS)

    # Take a distance sensor reading
    if distance_1.is_object_detected():
        # Get the distance in millimeters
        measured_distance = distance_1.object_distance(MM)
        brain.screen.print("Distance: ")
        brain.screen.print(measured_distance)
        brain.screen.print(" mm")
    else:
        brain.screen.print("No object detected")

    # Stop the drivetrain
    drivetrain.stop()

# Run the test
robot_test()
