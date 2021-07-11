# Doctolib Appointment Checker

This is a small Node.JS project that I maintain (barely) in me free time after work. There are a lot of things missing
or done quickly as my primary goal is to get an appointment and not write a state of the art scraper tool.

It can be also used for getting an appointment generally for a doctor or praxis on doctolib but there are more things that need to be taken care of (for example select boxes)
. Check `start.ts` for an example.

What it does do for you:
- It opens a Chromium window
- It goes to the sources url you provided for the public vaccination centers in berlin (I include some for berlin)
- Refreshes and looks for appointments visible on the calendar or later (if provided by the page)
- It alerts you with a sound effect
- It simulates click on the first appointment

What it does *not* do for you:
- It does not book the appointment automatically. After a time-slot is found you are on your own to book the second required
appointment and login to doctolib etc.
- It does not guarantee you will get an appointment.

_Tip: If you hear the alert and the page has no slot available or not clickable then it's too late. The appointment is booked already form somebody else._

Feel free to improve and add functionality as you wish and as it suites you. A pull request is welcome.

It has been tested and developed on Mac.
It works on Windows as well but I was told the alert is not audible.

# How to use
As usual:

```
npm install
npm start
```

Last time that was checked if it works: 11/06/2021
