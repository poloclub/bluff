# massif

_**massif**_: *"a compact group of mountains, especially one that is separate from other groups"*

[Summit][summit] follow-up.

[summit]: http://github.com/fredhohman/summit


### Install dependencies
```bash
pip install -r requirements.txt
```

### Data specification
- activation_data: neurons' activation. It is a dictionary, where
  - key: layer
  - val: a dictionary, where
      - key: neuron id (e.g., 'mixed3b-0')
      - val: a dictionary, where
          - key: one of \['original', 'target', 'attacked-{attack_alg}-{attack_strength'}\]
          - val: a dictionary, where
              - key: domain value key, one of \['median_activation', 'median_activation_percentile'\]
              - val: the domain value
  
