import os
import json

from constants import *
from paths import DataPaths


def calculate_neuron_vulnerabilities(neuron_data, attack_name, attack_strengths):
    overall_vulnerability = 0.0
    strengthwise_vulnerabilities = dict()

    original_percentile = \
        neuron_data['original']['median_activation_percentile']

    for strength in attack_strengths:
        if strength == 0.0:
            continue

        key = 'attacked-%s-%0.02f' % (attack_name, strength)
        percentile_at_strength = \
            neuron_data[key]['median_activation_percentile']

        vulnerability = \
            abs(percentile_at_strength - original_percentile) / strength

        overall_vulnerability += vulnerability
        strengthwise_vulnerabilities[key] = vulnerability

    return {'overall_vulnerability': {attack_name: overall_vulnerability},
            'strengthwise_vulnerability': {
                attack_name: strengthwise_vulnerabilities}}


def preprocess_scores(original_class, target_class,
                      attack_name='pgd'):

    keep_top_n = 100
    attack_strengths = list(ATTACK_STRENGTHS)

    neuron_scores_data_path = DataPaths.get_neuron_data_datapath(
        original_class, target_class, attack_name)
    assert os.path.exists(neuron_scores_data_path)

    vulnerabilities_data_path = DataPaths.get_neuron_vulnerabilities_datapath(
        original_class, target_class, attack_name)
    assert not os.path.exists(vulnerabilities_data_path)

    top_neurons_data_path = DataPaths.get_top_neurons_datapath(
        original_class, target_class, attack_name)
    assert not os.path.exists(top_neurons_data_path)

    neuron_scores_data = json.load(open(neuron_scores_data_path, 'r'))

    layers = list(neuron_scores_data.keys())
    top_neurons = dict()
    vulnerabilities = dict()
    for layer in layers:
        neurons_set = set()
        top_neurons[layer] = dict()
        vulnerabilities[layer] = dict()

        top_neurons[layer]['original'] = list(map(lambda x: x[0], sorted(
            neuron_scores_data[layer].items(),
            key=lambda x: x[1]['original']['median_activation_percentile'],
            reverse=True)[:keep_top_n]))
        neurons_set.update(top_neurons[layer]['original'])

        top_neurons[layer]['target'] = list(map(lambda x: x[0], sorted(
            neuron_scores_data[layer].items(),
            key=lambda x: x[1]['target']['median_activation_percentile'],
            reverse=True)[:keep_top_n]))
        neurons_set.update(top_neurons[layer]['target'])

        for strength in attack_strengths:
            key = 'attacked-%s-%0.02f' % (attack_name, strength)
            top_neurons[layer][key] = list(map(lambda x: x[0], sorted(
                neuron_scores_data[layer].items(),
                key=lambda x: x[1][key]['median_activation_percentile'],
                reverse=True)[:keep_top_n]))
            neurons_set.update(top_neurons[layer][key])

        for neuron in neurons_set:
            vulnerabilities[layer][neuron] = calculate_neuron_vulnerabilities(
                neuron_scores_data[layer][neuron],
                attack_name, attack_strengths)

    with open(vulnerabilities_data_path, 'w') as f:
        json.dump(vulnerabilities, f, indent=2)

    with open(top_neurons_data_path, 'w') as f:
        json.dump(top_neurons, f, indent=2)
