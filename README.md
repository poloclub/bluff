## Bluff: Interactively Deciphering Adversarial Attacks on Deep NeuralNetworks

### Motivation

Deep learning is now pervasive, and has been applied to diverse domains such as grocery shopping, entertainment, and finance. But can we confidently and securely apply it everywhere? Deep neural networks (DNNs) are vulnerable to _adversarial attacks_: typically small and human-imperceptible perturbations on data inputs that cause models to make incorrect predictions. While there has been significant interest within the machine learning community on developing attack and defense techniques for DNNs, there is a lack of research in understanding how such attacks permeate a model's internals. For example, which neurons are exploited to cause a model to misclassify an ambulance as a street sign; is a stronger attack harming the same neurons as a weaker attack, or are they completely different?

We build **Bluff**, an interactive system for visualizing, characterizing, and deciphering adversarial attacks on vision-based neural networks. **Bluff** allows people to flexibly compare and visualize the activation pathways of benign and attacked images throughout a network, and examine the effect of varying adversarial attack strengths. **Bluff** is open-sourced and runs in modern web browsers. Demo is available [Here](https://poloclub.github.io/bluff).

### Requirements
This project is written in python 3.7.6. You can install the dependencies by running:
```bash
pip install -r requirements.txt
```

### How to run the code
For demo, 

1. Create and run a server
```
python -m http.server <PORT>
``` 

2. Open a web browser

3. Go to `localhost:<PORT>/code/frontend` in your browser.

### License
This code is released under the MIT License (refer to the LICENSE file for details).

