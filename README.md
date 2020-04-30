# Bluff

Bluff is an interactive system for deciphering adversarial attacks on Deep Neural Networks (DNNs). 

- **Live demo:** [https://poloclub.github.io/bluff/](https://poloclub.github.io/bluff/)
- **Code and Data:** [https://github.com/poloclub/bluff](https://github.com/poloclub/bluff)

[https://poloclub.github.io/bluff/](teaser-bluff.png)

## Live Demo
For a live demo, visit: https://poloclub.github.io/bluff/

## Code and Data
Code of both frontend and backend and data are available at [https://github.com/poloclub/bluff](https://github.com/poloclub/bluff).

## Running Bluff user interface Locally
1. Download or clone this repository:

```bash
git clone https://github.com/fredhohman/summit.git
```

2. Within `bluff` repo, run:
  ```bash
  python -m http.server <PORT>
  ```
  For example,
  ```bash
  python -m http.server 8080
  ```
  You need python 3.
  
3. Open any web browser and go to `http://localhost:<PORT>`. For example, `http://localhost:8080' if you used port 8080.

## Running Bluff backend
This project is written in python 3.7.6. You can install the dependencies by running:
```
pip install -r requirements.txt
```

