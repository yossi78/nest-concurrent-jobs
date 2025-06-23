@echo off
REM Simulate a C++ application that randomly succeeds or fails
REM Usage: dummy-cpp-app.bat [arg1] [arg2] ...

echo Starting dummy C++ application with arguments: %*
echo Job started at: %date% %time%

REM Simulate some processing time (1-5 seconds)
set /a sleep_time=%random% %% 5 + 1
ping -n %sleep_time% 127.0.0.1 >nul 2>&1

REM Randomly succeed (80% success rate) or fail (20% failure rate)
set /a random_num=%random% %% 100

if %random_num% lss 80 (
    echo Job completed successfully
    echo Success at: %date% %time%
    exit /b 0
) else (
    echo Job failed with error
    echo Failure at: %date% %time%
    exit /b 1
) 