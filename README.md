## Bluff: Interactively Deciphering Adversarial Attacks on Deep Neural Networks

### Motivation

Deep neural networks (DNNs) are now commonly used in many domains. However, they are vulnerable to adversarial attacks: carefully-crafted perturbations on data inputs can easily fool a model into making incorrect predictions. Despite significantmachine learning research on developing DNN attack and defense techniques, people still lack an understanding of how such attackspenetrate a model’s internals. For example, which neurons are exploited by an attack to fool a model into misclassifying anambulance as a street sign? Is a stronger attack harming the same neurons as a weaker attack, or are they completely different? We present Bluff, an interactive system for visualizing, characterizing, and deciphering adversarial attacks on vision-based neural networks. Bluff allows people to flexibly visualize and compare the activation pathways for benign and attacked images, revealing specificmechanisms that adversarial attacks employ to inflict harm on a model. We present neural network exploration scenarios where Bluff helps us discover multiple surprising insights into the vulnerability of a prevalent, large-scale image classifier, such as how atypicalneuron activation pathways are exploited by attacks, and how class similarity correlates with exploitation intensity. Our findings helpinform future research on designing models that are more robust against attacks. Bluff is open-sourced and runs in modern web browsers. Demo is available [Here](https://poloclub.github.io/bluff).

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
This code is released under the MIT License (refer to the LICENSE.md[LICENSE.md] for details).

