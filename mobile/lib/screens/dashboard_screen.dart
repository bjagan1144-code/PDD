import 'package:flutter/material.dart';
import '../components/nav_drawer.dart';
import '../services/api_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _api = ApiService();
  bool _isLoading = true;
  
  // Dashboard statistics data
  int _totalSims = 0;
  String _avgRelease = '0.0%';
  String _avgScore = '0/100';
  String _aiModel = 'Random Forest Regression';
  String _backendStatus = 'offline';
  String _modelStatus = 'unavailable';
  
  List<dynamic> _recentSims = [];

  @override
  void initState() {
    super.initState();
    _loadSummary();
  }

  Future<void> _loadSummary() async {
    setState(() => _isLoading = true);
    try {
      final summary = await _api.getDashboardSummary();
      setState(() {
        _totalSims = summary['totalSimulations'] ?? 0;
        _avgRelease = summary['avgPredictedRelease'] ?? '0.0%';
        _avgScore = summary['controlledReleaseScore'] ?? '0/100';
        _aiModel = summary['activeAIModel'] ?? 'Random Forest Regression';
        _backendStatus = summary['backendStatus'] ?? 'connected';
        _modelStatus = summary['modelStatus'] ?? 'loaded';
        _recentSims = summary['recentSimulations'] ?? [];
      });
    } catch (_) {
      // Fallback local calculations from history in mock mode
      try {
        final history = await _api.getSimulationsHistory();
        if (history.isNotEmpty) {
          final total = history.length;
          double releaseSum = 0;
          int scoreSum = 0;
          for (var item in history) {
            releaseSum += (item['predictedRelease'] as num).toDouble();
            scoreSum += (item['controlledReleaseScore'] as num).toInt();
          }
          setState(() {
            _totalSims = total;
            _avgRelease = '${(releaseSum / total).toStringAsFixed(1)}%';
            _avgScore = '${(scoreSum / total).round()}/100';
            _recentSims = history.take(4).toList();
          });
        }
      } catch (_) {}
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    value,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('BIOPATCH AI DASHBOARD'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadSummary,
          )
        ],
      ),
      drawer: const NavDrawer(currentRoute: '/dashboard'),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadSummary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Warning Disclaimer Banner
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: Colors.amber.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.amber.withOpacity(0.15)),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.shield_outlined, size: 20, color: Colors.amber[400]),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'ACADEMIC RESEARCH PROTOTYPE NOTICE',
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.amber),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'BioPatch AI is an academic research and simulation prototype. Predictions are computational estimates and not clinical dosing instructions.',
                                  style: TextStyle(fontSize: 9, color: Colors.grey, height: 1.3),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Health check panels
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'PLATFORM STATUS',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Backend Core API:', style: TextStyle(fontSize: 12)),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: _backendStatus == 'connected' ? const Color(0xFF10B981).withOpacity(0.1) : Colors.amber.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: _backendStatus == 'connected' ? const Color(0xFF10B981).withOpacity(0.3) : Colors.amber.withOpacity(0.3)),
                                  ),
                                  child: Text(
                                    _backendStatus == 'connected' ? 'CONNECTED' : 'OFFLINE MODE',
                                    style: TextStyle(
                                      fontSize: 8, 
                                      fontWeight: FontWeight.bold, 
                                      color: _backendStatus == 'connected' ? const Color(0xFF10B981) : Colors.amber
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('AI Predictor Module:', style: TextStyle(fontSize: 12)),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: _modelStatus == 'loaded' ? Colors.purple.withOpacity(0.1) : Colors.grey.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: _modelStatus == 'loaded' ? Colors.purple.withOpacity(0.3) : Colors.grey.withOpacity(0.3)),
                                  ),
                                  child: Text(
                                    _modelStatus == 'loaded' ? 'LOADED' : 'UNAVAILABLE',
                                    style: TextStyle(
                                      fontSize: 8, 
                                      fontWeight: FontWeight.bold, 
                                      color: _modelStatus == 'loaded' ? Colors.purple[300] : Colors.grey
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Stats Cards Grid
                    _buildStatCard('TOTAL PRE-CLINICAL SIMULATIONS', _totalSims.toString(), Icons.science_outlined, const Color(0xFF0EA5E9)),
                    const SizedBox(height: 8),
                    _buildStatCard('AVG PREDICTED CUMULATIVE RELEASE', _avgRelease, Icons.donut_large_rounded, Colors.blue),
                    const SizedBox(height: 8),
                    _buildStatCard('CONTROLLED RELEASE SCORE — RESEARCH METRIC', _avgScore, Icons.layers_outlined, Colors.teal),
                    const SizedBox(height: 8),
                    _buildStatCard('ACTIVE REGRESSION NETWORK', _aiModel, Icons.psychology_outlined, Colors.purple),
                    const SizedBox(height: 24),

                    // Recent simulations log
                    const Text(
                      'RECENT MODELING HISTORY',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.1),
                    ),
                    const SizedBox(height: 12),
                    if (_recentSims.isEmpty)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 24.0),
                          child: Text('No historical modeling entries registered.', style: TextStyle(color: Colors.grey, fontSize: 12)),
                        ),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _recentSims.length,
                        itemBuilder: (context, index) {
                          final item = _recentSims[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              title: Text('${item['drugName']} in ${item['polymerName']} matrix'),
                              subtitle: Text(
                                'Final Release: ${item['predictedRelease']}% | Duration: ${item['duration']}h',
                                style: const TextStyle(fontSize: 11),
                              ),
                              trailing: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: item['riskLevel'] == 'High' ? Colors.red.withOpacity(0.1) : Colors.green.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  item['riskLevel'].toString().toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 8,
                                    fontWeight: FontWeight.bold,
                                    color: item['riskLevel'] == 'High' ? Colors.red[300] : Colors.green[300]
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      )
                  ],
                ),
              ),
            ),
    );
  }
}
