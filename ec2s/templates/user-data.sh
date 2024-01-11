#! /bin/bash
# Step1: Kernel Optimization
echo '
* soft nofile 65536
* hard nofile 65536
' >> /etc/security/limits.conf

# Step2: Install requirements
yum update -y && yum install -y git docker wget curl

{% if (block_disk_size > 0) %}
# Step3: Mount EBS
mkfs -t xfs /dev/sdb
mkdir -p {{ block_disk_mount_path }}
mount /dev/sdb {{ block_disk_mount_path }}
cp /etc/fstab /etc/fstab.orig
UUID=$(blkid | grep /dev/nvme1n1 | sed -r 's/.*UUID="([^"]*).*"/UUID=\1/')
MOUNT="{{ block_disk_mount_path }}  xfs  defaults,nofail  0  2"
echo "${UUID}  ${MOUNT}" >> /etc/fstab
chown -R ec2-user.ec2-user {{ block_disk_mount_path }}

# Step4: Config docker
echo '{
	"log-driver": "json-file",
	"log-opts": {
		"max-size": "50m",
		"max-file":  "1"
	},
    "graph": "/data/docker"
}' > /etc/docker/daemon.json
systemctl daemon-reload
systemctl enable docker
systemctl start docker
usermod -a -G docker ec2-user
{% else %}
systemctl enable docker
systemctl start docker
usermod -a -G docker ec2-user
{% endif %}

# Step5: Config vim
wget -O /home/ec2-user/.vimrc https://gist.githubusercontent.com/codiy1992/a97395d00ca48c4c3ed92c1aa472b12c/raw/ec2.vimrc
cp --force /home/ec2-user/.vimrc /root/.vimrc
chown ec2-user.ec2-user /home/ec2-user/.vimrc

# Step6: Authorize My SSH Public Key
wget -O - https://gist.githubusercontent.com/codiy1992/a97395d00ca48c4c3ed92c1aa472b12c/raw/id_rsa.pub \
    >> /home/ec2-user/.ssh/authorized_keys

# Step7: Install Docker Compose
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Step8: Install CloudWatch Agent
# wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/arm64/latest/amazon-cloudwatch-agent.rpm
# sudo rpm -U ./amazon-cloudwatch-agent.rpm
#
# echo -e '{
#     "metrics": {
#         "append_dimensions": {
#             "InstanceId": "${aws:InstanceId}",
#             "AutoScalingGroupName": "${aws:AutoScalingGroupName}"
#         },
#         "metrics_collected": {
#             "mem": {
#                 "metrics_collection_interval": 60,
#                 "measurement": [
#                     "mem_used_percent"
#                 ]
#             },
#             "disk": {
#                 "metrics_collection_interval": 60,
#                 "resources": [
#                     "/",
#                     "/data"
#                 ],
#                 "measurement": [
#                     "used_percent"
#                 ]
#             }
#         },
#         "aggregation_dimensions": [
#             [
#                 "AutoScalingGroupName"
#             ]
#         ]
#     }
# }'> /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
#
# /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
#     -a fetch-config -m ec2 \
#     -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
#     -s
# /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
#     -m ec2 -a status
